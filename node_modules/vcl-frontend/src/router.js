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

  // 登録されていないパスならルート('/')扱いにするなどのフォールバック
  const route = routes[path] || routes['/'];

  if (route) {
    // 各画面の描画関数を実行
    await route(params);
  } else {
    console.warn(`Route not found for path: ${path}`);
    if (routes['/']) routes['/']({});
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
