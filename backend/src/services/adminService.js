import { TrophyRepository } from '../repositories/trophyRepository.js';

class AdminService {
  constructor() {
    this.trophyRepository = new TrophyRepository();
  }

  async resetAllTrophies() {
    try {
      await this.trophyRepository.deleteAll();
      return { success: true, message: '全ユーザーのトロフィーデータを削除しました' };
    } catch (error) {
      console.error('Reset error:', error);
      throw new Error('データの削除に失敗しました');
    }
  }
}

export default new AdminService();
