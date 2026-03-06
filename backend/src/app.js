/**
 * ファイル名: backend/src/app.js
 * 概要: バックエンドのエントリーポイント
 * 役割:
 *   - Expressサーバーの設定と起動
 *   - ルーティングの統合
 *   - データベース接続の初期化
 *   - Socket.IOサーバーの設定
 *   - Joy-Con連携サービスの初期化
 */
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/database.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import gyroRoutes from './routes/gyroRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import trophyRoutes from './routes/trophyRoutes.js';
import { JoyConService } from './services/joyconService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = 3000;

const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set('io', io);

// Joy-Conサービスの初期化
try {
    const joyConService = new JoyConService();
    joyConService.connect(); // ← これを追加！これがないとデバイスを探しに行きません
    joyConService.on('change', (data) => {
        // JoyConIndex に応じて操作対象を割り当て
        // Index 0: 試験管 (Test Tube)
        // Index 1: フラスコ (Flask)
        let target = 'test_tube';
        if (data.joyconIndex === 1) {
            target = 'flask';
        }

        // デバッグログ: 初回または稀に表示して接続確認をしやすくする
        if (Math.random() < 0.005) {
             console.log(`JoyCon[${data.joyconIndex}] -> ${target} (Angle: ${data.angle.toFixed(1)})`);
        }

        // 全クライアントにブロードキャスト
        // フロントエンドのLabScene.jsは 'gyro-data' イベントをリッスンし、data.angle を期待している
        io.emit('gyro-data', {
            target: target,    // 操作対象 ('test_tube' or 'flask')
            angle: data.angle, // JoyConServiceで計算済みの角度 (Roll)
            // raw: data          // デバッグ用など
            // data全体を渡すように変更 (sticks, buttonsなどが含まれている)
            raw: data
        });
    });
    console.log('Joy-Con Service initialized');
} catch (error) {
    console.warn('Joy-Con initialization failed (Optional):', error.message);
}

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trophies', trophyRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes); // Admin routes added
app.use('/gyro', gyroRoutes);

app.get('/api/chemicals', (req, res) => {
    try {
        // App is run from backend/src but working directory may be backend root
        const periodicPath = path.resolve(__dirname, 'data/periodic.json');

        const rawData = fs.readFileSync(periodicPath, 'utf-8');
        const chemicals = JSON.parse(rawData);
        res.json(chemicals);
    } catch (err) {
        console.error('Failed to load chemicals data:', err);
        res.status(500).json({ error: 'Failed to load chemicals data' });
    }
});

// ヘルスチェック用
app.get('/', (req, res) => {
    res.send('VCL Backend API is running');
});

// データベース初期化とサーバー起動
initializeDatabase()
    .then(async () => {
        // 開発用デモユーザーの作成 (try-catchで囲んでエラーを無視)
        try {
            const { AuthService } = await import('./services/authService.js');
            const authService = new AuthService();
            // 初期ユーザー: user@example.com / password123
            await authService.register('Demo User', 'user@example.com', 'password123');
            console.log('Demo user ensured: user@example.com / password123');
        } catch (error) {
            // ユーザーが既に存在するなどのエラーは無視
        }
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

