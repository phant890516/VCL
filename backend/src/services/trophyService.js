/**
 * ファイル名: backend/src/services/trophyService.js
 * 概要: トロフィー機能のビジネスロジック
 * 役割:
 *   - トロフィー獲得条件の検証（必要であれば）
 *   - Repository層を通じたデータ永続化の呼び出し
 * アーキテクチャ: Service層
 */
// src/services/trophyService.js
import { TrophyRepository } from '../repositories/trophyRepository.js';

export class TrophyService {
    constructor() {
        this.trophyRepository = new TrophyRepository();
    }

    async getHistory(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        return await this.trophyRepository.findByUserId(userId);
    }

    async unlockTrophy(userId, trophyId) {
        if (!userId || !trophyId) {
            throw new Error('User ID and Trophy ID are required');
        }
        return await this.trophyRepository.create(userId, trophyId);
    }
}
