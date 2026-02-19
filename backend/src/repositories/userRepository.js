import { getDb } from '../db/database.js';

export class UserRepository {
    async findByEmail(email) {
        if (!email) return null;
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE email = ?', email);
    }

    async findByUsername(username) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE username = ?', username);
    }

    async create(user) {
        const db = getDb();
        const { username, email, password, role, nickname, full_name } = user;
        const result = await db.run(
            'INSERT INTO users (username, email, password, role, nickname, full_name) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email || null, password, role || 'student', nickname || null, full_name || null]
        );
        return { id: result.lastID, ...user };
    }
}
