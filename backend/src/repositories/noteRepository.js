import { getDb } from '../db/database.js';

export class NoteRepository {
    async findByUserId(userId) {
        const db = getDb();
        return await db.get('SELECT * FROM notes WHERE user_id = ?', userId);
    }

    async save(userId, content) {
        const db = getDb();
        const existing = await this.findByUserId(userId);
        if (existing) {
            await db.run('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [content, userId]);
        } else {
            await db.run('INSERT INTO notes (user_id, content) VALUES (?, ?)', [userId, content]);
        }
        return { user_id: userId, content };
    }
}
