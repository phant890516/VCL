/**
 * ファイル名: backend/src/controllers/trophyController.js
 * 概要: トロフィー機能のコントローラー
 * 役割:
 *   - クライアントからのトロフィー関連リクエスト（取得、解除）のハンドリング
 *   - Service層への委譲
 * アーキテクチャ: Controller層
 */
import { TrophyService } from '../services/trophyService.js';

const trophyService = new TrophyService();

export class TrophyController {
    async getHistory(req, res) {
        try {
            const userId = req.params.userId || req.query.userId || req.body.userId; // Accept from params, query or body
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const history = await trophyService.getHistory(userId);
            res.json(history);
        } catch (error) {
            console.error('Error fetching trophies:', error);
            res.status(500).json({ error: 'Failed to fetch trophies' });
        }
    }

    async unlock(req, res) {
        try {
            const { userId, trophyId } = req.body;
            if (!userId || !trophyId) {
                return res.status(400).json({ error: 'Content required' });
            }

            const result = await trophyService.unlockTrophy(userId, trophyId);
            if (result) {
                res.status(201).json({ success: true, trophy: result });
            } else {
                res.json({ success: false, message: 'Already unlocked' });
            }
        } catch (error) {
            console.error('Error unlocking trophy:', error);
            res.status(500).json({ error: 'Failed to unlock trophy' });
        }
    }
}
