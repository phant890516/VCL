import express from 'express';
import { ProgressController } from '../controllers/progressController.js';

const router = express.Router();
const progressController = new ProgressController();

router.get('/:userId', (req, res) => progressController.getProgress(req, res));
router.post('/', (req, res) => progressController.recordProgress(req, res));

export default router;
