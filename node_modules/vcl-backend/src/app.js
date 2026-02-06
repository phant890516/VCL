import cors from 'cors';
import express from 'express';
import { initializeDatabase } from './db/database.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

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

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

