/**
 * backend entry point.
 *
 * 役割:
 * - Express API を起動する
 * - Socket.IO で Joy-Con 入力をフロントエンドへ送る
 * - API ルートをまとめる
 *
 * DB 初期化は今日の共同実装で決めるため、ここでは行わない。
 */
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import gyroRoutes from './routes/gyroRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import trophyRoutes from './routes/trophyRoutes.js';
import { JoyConService } from './services/joyconService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
app.set('io', io);

try {
    const joyConService = new JoyConService();
    joyConService.connect();
    joyConService.on('change', (data) => {
        const target = data.joyconIndex === 1 ? 'flask' : 'test_tube';

        if (Math.random() < 0.005) {
            console.log(`JoyCon[${data.joyconIndex}] -> ${target} (Angle: ${data.angle.toFixed(1)})`);
        }

        io.emit('gyro-data', {
            target,
            angle: data.angle,
            raw: data
        });
    });
    console.log('Joy-Con Service initialized');
} catch (error) {
    console.warn('Joy-Con initialization failed (Optional):', error.message);
}

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trophies', trophyRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/gyro', gyroRoutes);

app.get('/api/chemicals', (req, res) => {
    try {
        const periodicPath = path.resolve(__dirname, 'data/periodic.json');
        const rawData = fs.readFileSync(periodicPath, 'utf-8');
        res.json(JSON.parse(rawData));
    } catch (err) {
        console.error('Failed to load chemicals data:', err);
        res.status(500).json({ error: 'Failed to load chemicals data' });
    }
});

app.get('/', (req, res) => {
    res.send('VCL Backend API is running');
});

// TODO: ここに今日決めたDB初期化処理を書く。
// 例: Supabase接続確認、初期データ投入、マイグレーション確認など。
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
