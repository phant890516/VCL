import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fakeDb } = vi.hoisted(() => ({
    fakeDb: {
        all: vi.fn(),
        get: vi.fn(),
        run: vi.fn()
    }
}));

vi.mock('../db/database.js', () => ({
    getDb: () => fakeDb
}));

const { TrophyRepository } = await import('../repositories/trophyRepository.js');
const { ProgressRepository } = await import('../repositories/progressRepository.js');

describe('TrophyRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads trophies for a user from the shared database connection', async () => {
        const trophies = [{ id: 1, user_id: 7, trophy_id: 'trophy_exp_01' }];
        fakeDb.all.mockResolvedValueOnce(trophies);

        const repository = new TrophyRepository();
        await expect(repository.findByUserId(7)).resolves.toEqual(trophies);

        expect(fakeDb.all).toHaveBeenCalledWith(
            'SELECT id, user_id, trophy_id, acquired_at FROM user_trophies WHERE user_id = ? ORDER BY acquired_at DESC',
            [7]
        );
    });

    it('returns null when a trophy is already unlocked', async () => {
        const constraintError = new Error('constraint failed');
        constraintError.code = 'SQLITE_CONSTRAINT';
        fakeDb.run.mockRejectedValueOnce(constraintError);

        const repository = new TrophyRepository();
        await expect(repository.create(7, 'trophy_exp_01')).resolves.toBeNull();
    });
});

describe('ProgressRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('records progress against an experiment code', async () => {
        fakeDb.get.mockResolvedValueOnce({
            id: 3,
            experiment_code: 'exp_03',
            title: '金属の溶け方（アルミニウム）'
        });
        fakeDb.run.mockResolvedValueOnce({ lastID: 12 });

        const repository = new ProgressRepository();
        const result = await repository.create(7, 'exp_03', 'completed');

        expect(fakeDb.get).toHaveBeenCalledWith(
            'SELECT id, experiment_code, title FROM experiments WHERE experiment_code = ?',
            ['exp_03']
        );
        expect(fakeDb.run).toHaveBeenCalledWith(
            'INSERT INTO user_progress (user_id, experiment_id, status) VALUES (?, ?, ?)',
            [7, 3, 'completed']
        );
        expect(result).toMatchObject({
            id: 12,
            user_id: 7,
            experiment_code: 'exp_03',
            status: 'completed'
        });
    });

    it('rejects unknown experiment codes', async () => {
        fakeDb.get.mockResolvedValueOnce(null);

        const repository = new ProgressRepository();
        await expect(repository.create(7, 'exp_99', 'completed')).rejects.toThrow('Unknown experiment code');
    });
});
