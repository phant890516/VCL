import './style.css';
import template from './template.html?raw';

export function SettingView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // ユーザー情報の反映
    const userJson = localStorage.getItem('vcl_user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            const nameEl = container.querySelector('.profile-name');
            const metaEl = container.querySelector('.profile-meta');

            if (nameEl) nameEl.textContent = user.username || 'Unknown User';
            if (metaEl) {
                // ロール名の日本語化マッピング
                const roleMap = { 'student': '生徒', 'teacher': '教師', 'admin': '管理者' };
                const roleName = roleMap[user.role] || user.role || 'GUEST';
                // IDはDBのIDを使うか、ランダムなハッシュ風に見せるか
                const displayId = user.id ? `user_${String(user.id).padStart(8, '0')}` : 'user_--------';

                metaEl.textContent = `ID: ${displayId} | Role: ${roleName}`;
            }
        } catch (e) {
            console.error('Failed to parse user info', e);
        }
    }

    const btnLogout = container.querySelector('#btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
           if(confirm('ログアウトしますか？')) {
               localStorage.removeItem('vcl_token');
               localStorage.removeItem('vcl_user');
               navigateTo('/login');
           }
        });
    }

    const btnDelete = container.querySelector('#btn-delete-account');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if(confirm('本当に削除しますか？')) {
                alert('削除しました');
            }
        });
    }

    return container;
}
