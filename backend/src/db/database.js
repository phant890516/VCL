/**
 * DB接続の置き場。
 *
 * 旧ローカルDB実装は削除済み。
 * 今日の共同作業で DB 方針を決めたら、このファイルに接続初期化や共通処理を書く。
 */

export async function initializeDatabase() {
    // TODO: ここにDB初期化処理を書く。
    // 例: Supabaseの疎通確認、初期データ投入、マイグレーション確認など。
    return null;
}

export function getDb() {
    // TODO: ここにRepositoryから使うDBクライアント取得処理を書く。
    throw new Error('DB client is not implemented yet.');
}
