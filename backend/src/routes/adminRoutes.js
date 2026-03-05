import express from 'express';
import adminController from '../controllers/adminController.js';

const router = express.Router();

router.delete('/reset', (req, res) => adminController.resetData(req, res));

export default router;
