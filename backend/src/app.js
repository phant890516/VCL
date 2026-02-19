import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase } from './db/database.js';
import authRoutes from './routes/authRoutes.js';
import gyroRoutes from './routes/gyroRoutes.js';

const app = express();
const httpServer = createServer(app);
const PORT = 3000;

const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
app.set('io', io);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/gyro', gyroRoutes);

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

