/**
 * ファイル名: backend/src/routes/trophyRoutes.js
 * 概要: トロフィーAPIのルーティング定義
 * 役割:
 *   - /api/trophies 以下のエンドポイント定義
 *   - リクエストURLとコントローラーメソッドのマッピング
 */
import express from 'express';
import { TrophyController } from '../controllers/trophyController.js';

const router = express.Router();
const trophyController = new TrophyController();

// GET /api/trophies/history/:userId
router.get('/history/:userId', (req, res) => trophyController.getHistory(req, res));

// POST /api/trophies/unlock
router.post('/unlock', (req, res) => trophyController.unlockTrophy(req, res));

export default router;