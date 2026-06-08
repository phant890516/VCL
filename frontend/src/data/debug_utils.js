export function resetTrophies() {
    // TODO: ここにDB側のトロフィーリセット処理を書く。
    // DB実装が決まるまでは、画面側のLocalStorage削除で確認する。
    localStorage.removeItem('vcl_user_trophies_offline');
    console.warn('Local trophy cache cleared. DB reset is not implemented yet.');
}
