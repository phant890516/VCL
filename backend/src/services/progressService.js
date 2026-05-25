import { ProgressRepository } from '../repositories/progressRepository.js';

const ALLOWED_STATUSES = new Set(['started', 'completed', 'failed']);

export class ProgressService {
    constructor() {
        this.progressRepository = new ProgressRepository();
    }

    async getProgress(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        return this.progressRepository.findByUserId(userId);
    }

    async recordProgress(userId, experimentCode, status = 'completed') {
        if (!userId || !experimentCode) {
            throw new Error('User ID and experiment code are required');
        }

        const normalizedStatus = String(status || 'completed').toLowerCase();
        if (!ALLOWED_STATUSES.has(normalizedStatus)) {
            throw new Error('Invalid progress status');
        }

        return this.progressRepository.create(userId, experimentCode, normalizedStatus);
    }
}
