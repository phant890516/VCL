import { NoteService } from '../services/noteService.js';

const noteService = new NoteService();

export class NoteController {
    async getNote(req, res) {
        try {
            const userId = req.params.userId;
            const content = await noteService.getNote(userId);
            res.json({ content });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async saveNote(req, res) {
        try {
            const { userId, content } = req.body;
            await noteService.saveNote(userId, content);
            res.json({ message: 'Note saved successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
