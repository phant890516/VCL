/**
 * メモ保存処理の置き場。
 *
 * 旧ローカルDB実装は削除済み。
 * Idea画面などでメモ保存を使う場合は、ここにDB保存処理を書く。
 */
export class NoteRepository {
    async findByUserId(userId) {
        // TODO: ここにユーザーごとのメモ取得処理を書く。
        if (!userId) return null;
        return null;
    }

    async save(userId, content) {
        // TODO: ここにメモ保存処理を書く。
        throw new Error('NoteRepository.save is not implemented yet.');
    }
}
