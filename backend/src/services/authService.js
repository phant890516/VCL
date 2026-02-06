import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';

const SECRET_KEY = 'vcl_secret_key_2026'; // 本番環境では環境変数を使用すること

export class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('メールアドレスまたはパスワードが間違っています。');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('メールアドレスまたはパスワードが間違っています。');
        }

        // 署名付きトークンの発行
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, username: user.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // パスワードを除外して返す
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async register(username, email, password) {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('このメールアドレスは既に登録されています。');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.userRepository.create({
            username,
            email,
            password: hashedPassword
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }
}
