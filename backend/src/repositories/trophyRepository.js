/**
 * トロフィー保存処理の置き場。
 *
 * 旧ローカルDB実装は削除済み。
 * 今日の共同作業でトロフィーテーブルを確定したら、このRepositoryに実装を書く。
 */
export class TrophyRepository {
    async findByUserId(userId) {
        // TODO: ここにユーザーごとのトロフィー履歴取得処理を書く。
        // 例: student_trophies から trophy_id と acquired_at を取得する。
        if (!userId) return [];
        return [];
    }

    async create(userId, trophyId) {
        // TODO: ここにトロフィー獲得保存処理を書く。
        // 同じトロフィーを重複保存しない制約もここで考える。
        throw new Error('TrophyRepository.create is not implemented yet.');
    }

    async deleteAll() {
        // TODO: ここに管理者用のトロフィーリセット処理を書く。
        throw new Error('TrophyRepository.deleteAll is not implemented yet.');
    }
}
