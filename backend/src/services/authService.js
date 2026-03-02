/**
 * ファイル名: backend/src/services/authService.js
 * 概要: 認証ビジネスロジック
 * 役割:
 *   - パスワードのハッシュ化と検証 (bcrypt)
 *   - JWTトークンの生成と検証
 *   - ユーザー登録・ログインロジックの実行
 * アーキテクチャ: Service層
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository.js';

const SECRET_KEY = 'vcl_secret_key_2026';
export class AuthService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async login(identifier, password) {
        // メールアドレスまたはユーザー名でユーザーを探す
        let user = null;
        if (identifier.includes('@')) {
            user = await this.userRepository.findByEmail(identifier);
        } else {
            user = await this.userRepository.findByUsername(identifier);
        }

        if (!user) {
            throw new Error('ユーザーIDまたはパスワードが間違っています。');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('ユーザーIDまたはパスワードが間違っています。');
        }

        // 署名付きトークンの発行
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, username: user.username, nickname: user.nickname },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // パスワードを除外して返す
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async register(username, email, password, nickname, role = 'student') {
        const existingUserByUsername = await this.userRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new Error('このユーザー名は既に登録されています。');
        }

        if (email) {
            const existingUserByEmail = await this.userRepository.findByEmail(email);
            if (existingUserByEmail) {
                throw new Error('このメールアドレスは既に登録されています。');
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // createメソッドはオブジェクトを受け取る
        const newUser = await this.userRepository.create({
            username,
            email: email || null,
            password: hashedPassword,
            nickname: nickname || username,
            role
        });

        // 登録後すぐにログイン状態にするためにトークンを発行
        // createメソッドの戻り値には role が含まれない場合がある（DB insert結果のみの場合など）ので注意が必要だが、
        // userRepository.createの実装では {...user} を返しているので role は含まれるはず。
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role, username: newUser.username, nickname: newUser.nickname },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = newUser;
        return { user: userWithoutPassword, token };
    }
}
