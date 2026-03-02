/**
 * ファイル名: backend/src/controllers/authController.js
 * 概要: 認証機能のコントローラー
 * 役割:
 *   - ログイン、新規登録リクエストの処理
 *   - 入力値の検証とService層へのデータ受け渡し
 * アーキテクチャ: Controller層
 */
import { AuthService } from '../services/authService.js';

const authService = new AuthService();

export class AuthController {
    async login(req, res) {
        try {
            const { email, username, password } = req.body;
            // emailまたはusernameのどちらかがあればOK
            const identifier = email || username;

            if (!identifier || !password) {
                return res.status(400).json({ error: 'ユーザーID(またはメールアドレス)とパスワードは必須です。' });
            }
            const result = await authService.login(identifier, password);
            res.json(result);
        } catch (error) {
            // セキュリティのため、詳細なエラー内容は伏せるべきだが、
            // 今回はクライアントへのフィードバックのためにメッセージを返す
            res.status(401).json({ error: error.message });
        }
    }

    async register(req, res) {
        try {
            const { username, email, password, nickname, role } = req.body;
             if (!username || !password) {
                return res.status(400).json({ error: 'ユーザー名とパスワードは必須です。' });
            }

            // emailが空文字列の場合はundefined/nullとして扱う
            const validEmail = email ? email : undefined;
            // roleが指定されていない場合はデフォルト 'student'
            const userRole = role === 'teacher' ? 'teacher' : 'student';

            const user = await authService.register(username, validEmail, password, nickname, userRole);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
