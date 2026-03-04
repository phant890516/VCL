import { NoteRepository } from '../repositories/noteRepository.js';

export class NoteService {
    constructor() {
        this.noteRepository = new NoteRepository();
    }

    async getNote(userId) {
        if (!userId) throw new Error('User ID is required');
        const note = await this.noteRepository.findByUserId(userId);
        return note ? note.content : '';
    }

    async saveNote(userId, content) {
        if (!userId) throw new Error('User ID is required');
        return await this.noteRepository.save(userId, content || '');
    }
}
