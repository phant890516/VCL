import { resetLocalTrophies } from '../../data/trophies.js';
import './style.css';

export function AdminView(navigateTo) {
  const container = document.createElement('div');
  container.classList.add('admin-container');

  container.innerHTML = `
    <h1>管理者パネル</h1>
    <div class="admin-card">
      <h2>データ管理</h2>
      <p>ユーザーの獲得トロフィーデータをすべて削除します。この操作は取り消せません。</p>
      <button id="reset-btn" class="danger-btn">データをリセット</button>
    </div>
    <div class="admin-actions">
       <a href="#" id="back-link" class="back-link">トップに戻る</a>
    </div>
  `;

  const resetBtn = container.querySelector('#reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('本当に全てのデータを削除しますか？\nこの操作は元に戻せません。')) {
        try {
          const response = await fetch('http://localhost:3000/api/admin/reset', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            // ローカルストレージも削除
            resetLocalTrophies();
            alert('データを削除しました');
          } else {
            throw new Error('削除に失敗しました');
          }
        } catch (error) {
          console.error(error);
          alert('エラーが発生しました: ' + error.message);
        }
      }
    });
  }

  const backLink = container.querySelector('#back-link');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });
  }

  return container;
}
