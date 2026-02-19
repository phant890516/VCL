import express from 'express';
import { GyroController } from '../controllers/gyroController.js';

const router = express.Router();
const gyroController = new GyroController();

// POST /gyro
router.post('/', gyroController.handleGyroData);

export default router;
