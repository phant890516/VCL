/**
 * ファイル名: backend/src/repositories/trophyRepository.js
 * 概要: トロフィーデータの永続化層
 * 役割:
 *   - user_trophies テーブルへの直接的なアクセス
 *   - SQLクエリの実行（検索、挿入）
 * アーキテクチャ: Repository層
 */
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../database.sqlite');

let db = null;
async function getDb() {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
    }
    return db;
}

export class TrophyRepository {
    async findByUserId(userId) {
        const db = await getDb();
        return db.all('SELECT * FROM user_trophies WHERE user_id = ?', [userId]);
    }

    async create(userId, trophyId) {
        const db = await getDb();
        try {
            const result = await db.run(
                'INSERT INTO user_trophies (user_id, trophy_id) VALUES (?, ?)',
                [userId, trophyId]
            );
            return { id: result.lastID, user_id: userId, trophy_id: trophyId, acquired_at: new Date() };
        } catch (error) {
            // UNIQUE constraint failure is common if frontend sends duplicates
            if (error.code === 'SQLITE_CONSTRAINT') {
                return null; // Already exists
            }
            throw error;
        }
    }
}
