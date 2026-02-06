import { getDb } from '../db/database.js';

export class UserRepository {
    async findByEmail(email) {
        const db = getDb();
        return await db.get('SELECT * FROM users WHERE email = ?', email);
    }

    async create(user) {
        const db = getDb();
        const { username, email, password, role } = user;
        const result = await db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role || 'student']
        );
        return { id: result.lastID, ...user };
    }
}
