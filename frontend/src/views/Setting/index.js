import { LoginView } from '../Login/index.js';
import './style.css';
import template from './template.html?raw';

export function SettingView(navigateTo) {
    // 1. ログイン状態のチェック (初期値はログインしていない状態を想定)
    const token = localStorage.getItem('vcl_token');

    // 2. ログインしていない場合は、「設定」画面の代わりに「ログイン」画面を表示する
    if (!token) {
        console.log('未ログインのため、ログイン画面を表示します');
        return LoginView(navigateTo);
    }

    // 3. ログインしている場合は通常通り設定画面を表示
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
               // ログアウト後は再度設定画面(=ログイン画面)を再描画するためリロードに近い挙動にするか、
               // あるいは明示的に navigateTo('/login') する。
               // 今回は要件に従い「設定の所」がログイン画面になるため、実質的に同じビューを再表示させる形になるが、
               // パスとしては /setting のままで中身が変わる
               navigateTo('/setting'); // リフレッシュ
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
