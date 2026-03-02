/**
 * ファイル名: backend/src/routes/authRoutes.js
 * 概要: 認証APIのルーティング
 * 役割:
 *   - /api/auth/login, /api/auth/register のエンドポイント定義
 */
import express from 'express';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();
const authController = new AuthController();

router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));

export default router;
