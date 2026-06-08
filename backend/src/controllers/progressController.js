import { ProgressService } from '../services/progressService.js';

const progressService = new ProgressService();

export class ProgressController {
    async getProgress(req, res) {
        try {
            // TODO: ここに通常ログインユーザーの進捗履歴取得をつなぐ。
            const userId = req.params.userId;
            const progress = await progressService.getProgress(userId);
            res.json(progress);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async recordProgress(req, res) {
        try {
            // TODO: ここに実験完了時の進捗保存をつなぐ。
            const { userId, experimentCode, status } = req.body;
            const progress = await progressService.recordProgress(userId, experimentCode, status);
            res.status(201).json({ success: true, progress });
        } catch (error) {
            const statusCode = error.message.startsWith('Unknown experiment') ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        }
    }
}
