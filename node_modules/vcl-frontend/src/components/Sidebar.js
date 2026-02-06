/**
 * サイドバーの初期化
 * 静的に配置されたサイドバーに対してイベントリスナーを設定する
 * @param {Function} navigateCallback - ナビゲーション実行時のコールバック関数 (idを受け取る)
 */
export function initSidebar(navigateCallback) {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      console.log(`Sidebar Clicked: ${id}`);

      // アクティブ表示の切り替え
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      if (navigateCallback) {
        navigateCallback(id);
      }
    });
  });
}
