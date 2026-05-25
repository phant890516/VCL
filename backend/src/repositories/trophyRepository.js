/**
 * ファイル名: backend/src/repositories/trophyRepository.js
 * 概要: user_trophies テーブルの永続化処理
 */
import { getDb } from '../db/database.js';

export class TrophyRepository {
    async findByUserId(userId) {
        const db = getDb();
        return db.all(
            'SELECT id, user_id, trophy_id, acquired_at FROM user_trophies WHERE user_id = ? ORDER BY acquired_at DESC',
            [userId]
        );
    }

    async create(userId, trophyId) {
        const db = getDb();
        try {
            const result = await db.run(
                'INSERT INTO user_trophies (user_id, trophy_id) VALUES (?, ?)',
                [userId, trophyId]
            );
            return {
                id: result.lastID,
                user_id: userId,
                trophy_id: trophyId,
                acquired_at: new Date().toISOString()
            };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                return null;
            }
            throw error;
        }
    }

    async deleteAll() {
        const db = getDb();
        return db.run('DELETE FROM user_trophies');
    }
}
