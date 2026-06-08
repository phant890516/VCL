import { resetLocalTrophies } from '../../data/trophies.js';
import './style.css';
import template from './template.html?raw';

export function AdminView(navigateTo) {
  const container = document.createElement('div');
  container.classList.add('admin-container');
  container.innerHTML = template;

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
