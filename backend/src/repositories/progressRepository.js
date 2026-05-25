import { getDb } from '../db/database.js';

export class ProgressRepository {
    async findByUserId(userId) {
        const db = getDb();
        return db.all(
            `
                SELECT
                    user_progress.id,
                    user_progress.user_id,
                    experiments.experiment_code,
                    experiments.title,
                    user_progress.status,
                    user_progress.played_at
                FROM user_progress
                JOIN experiments ON experiments.id = user_progress.experiment_id
                WHERE user_progress.user_id = ?
                ORDER BY user_progress.played_at DESC
            `,
            [userId]
        );
    }

    async create(userId, experimentCode, status) {
        const db = getDb();
        const experiment = await db.get(
            'SELECT id, experiment_code, title FROM experiments WHERE experiment_code = ?',
            [experimentCode]
        );

        if (!experiment) {
            throw new Error(`Unknown experiment code: ${experimentCode}`);
        }

        const result = await db.run(
            'INSERT INTO user_progress (user_id, experiment_id, status) VALUES (?, ?, ?)',
            [userId, experiment.id, status]
        );

        return {
            id: result.lastID,
            user_id: userId,
            experiment_code: experiment.experiment_code,
            title: experiment.title,
            status,
            played_at: new Date().toISOString()
        };
    }
}
