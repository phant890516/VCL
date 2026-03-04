import express from 'express';
import { NoteController } from '../controllers/noteController.js';

const router = express.Router();
const noteController = new NoteController();

router.get('/:userId', noteController.getNote);
router.post('/', noteController.saveNote);

export default router;
