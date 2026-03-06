/**
 * SPAルーターモジュール
 * History APIを利用してURLと画面描画を連動させる
 */

// ルート定義を保持するオブジェクト
const routes = {};

/**
 * ルートを登録する
 * @param {string} path - URLパス (例: '/lab', '/dashboard')
 * @param {Function} renderFunction - 描画を実行する関数
 */
export function registerRoute(path, renderFunction) {
  routes[path] = renderFunction;
}

/**
 * 指定したパスへ遷移する（アプリ内から呼ぶ用）
 * @param {string} path - 遷移先のパス
 * @param {object} params - 遷移先に渡すパラメータ
 */
export function navigateTo(path, params = {}) {
  // URLを書き換える（リロードなし）
  window.history.pushState(params, '', path);
  // 該当する画面を描画
  handleLocation();
}

/**
 * 現在のURLに基づいて画面を描画する
 */
async function handleLocation() {
  const path = window.location.pathname;

  // パラメータ取得 (History stateから)
  const params = window.history.state || {};

  // 1. 完全一致するパスがあるかをチェック
  // 2. なければ404ページへリダイレクト

  let route = routes[path];

  if (!route) {
    console.warn(`Route not found: ${path}. Redirecting to 404.`);

    // 404ルートがあるならそちらへ、なければホームへ
    if (routes['/404']) {
        window.history.replaceState({}, '', '/404');
        route = routes['/404'];
    } else {
        window.history.replaceState({}, '', '/');
        route = routes['/'];
    }
  }

  // 描画実行
  if (route) {
    await route(params);
  }
}

/**
 * ルーターを初期化する
 * アプリ起動時に一度だけ呼び出す
 */
export function initRouter() {
  // ブラウザの「戻る・進む」ボタン検知
  window.addEventListener('popstate', handleLocation);

  // 初回ロード時の描画
  handleLocation();
}
