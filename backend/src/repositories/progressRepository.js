/**
 * 進捗保存処理の置き場。
 *
 * 旧ローカルDB実装は削除済み。
 * 今日の共同作業で進捗テーブルを確定したら、このRepositoryに保存・取得処理を書く。
 */
export class ProgressRepository {
    async findByUserId(userId) {
        // TODO: ここにユーザーごとの進捗取得処理を書く。
        // 例: student_progress と experiments を結合して、画面表示用に返す。
        if (!userId) return [];
        return [];
    }

    async create(userId, experimentCode, status) {
        // TODO: ここに進捗保存処理を書く。
        // 例: experimentCode を experiments.experiment_code と照合して保存する。
        throw new Error('ProgressRepository.create is not implemented yet.');
    }
}
