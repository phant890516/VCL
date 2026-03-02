/**
 * ファイル名: backend/src/routes/gyroRoutes.js
 * 概要: ジャイロAPIのルーティング
 * 役割:
 *   - /gyro 以下のエンドポイント定義
 */
import express from 'express';
import { GyroController } from '../controllers/gyroController.js';

const router = express.Router();
const gyroController = new GyroController();

// POST /gyro
router.post('/', gyroController.handleGyroData);

export default router;
