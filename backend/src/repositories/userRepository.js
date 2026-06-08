/**
 * ユーザー保存処理の置き場。
 *
 * 旧ローカルDB実装は削除済み。
 * 先生・生徒アカウントをどう保存するか決めたら、このRepositoryに実装を書く。
 */
export class UserRepository {
    async findByEmail(email) {
        // TODO: ここにメールアドレスでユーザーを検索する処理を書く。
        // 例: Supabase Auth / users テーブル / teacher_profiles などから取得する。
        if (!email) return null;
        return null;
    }

    async findByUsername(username) {
        // TODO: ここにユーザーIDでユーザーを検索する処理を書く。
        // 生徒IDログインを使う場合は students.login_id と対応させる。
        if (!username) return null;
        return null;
    }

    async create(user) {
        // TODO: ここにユーザー作成処理を書く。
        // パスワードは必ずハッシュ化済みの値だけを保存する。
        throw new Error('UserRepository.create is not implemented yet.');
    }
}
