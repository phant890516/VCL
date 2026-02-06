import { AuthService } from '../services/authService.js';

const authService = new AuthService();

export class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'メールアドレスとパスワードは必須です。' });
            }
            const result = await authService.login(email, password);
            res.json(result);
        } catch (error) {
            // セキュリティのため、詳細なエラー内容は伏せるべきだが、
            // 今回はクライアントへのフィードバックのためにメッセージを返す
            res.status(401).json({ error: error.message });
        }
    }

    async register(req, res) {
        try {
            const { username, email, password } = req.body;
             if (!username || !email || !password) {
                return res.status(400).json({ error: 'すべての項目を入力してください。' });
            }
            const user = await authService.register(username, email, password);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
