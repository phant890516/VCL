/**
 * ファイル名: frontend/src/views/Register/index.js
 * 概要: 新規登録画面（View）の実装
 * 役割:
 *   - ユーザー情報入力フォーム（メール、パスワード、ニックネーム）
 *   - 生徒/教師ロールの選択UI
 *   - 登録APIの呼び出し
 */
import './style.css';
import template from './template.html?raw';
import './toggle_v2.css';

export function RegisterView(navigateTo) {
    const container = document.createElement('div');
    // container.classList.add('view-container'); // 不要: template内で .register-wrapper が全て管理するため
    container.innerHTML = template;

    // イベントリスナー設定
    const form = container.querySelector('#register-form');
    const roleToggle = container.querySelector('#reg-role-toggle');
    const formTitle = container.querySelector('#form-title');
    const wrapper = container.querySelector('.register-wrapper');

    if (roleToggle) {
        roleToggle.addEventListener('change', (e) => {
            const isTeacher = e.target.checked;
            if (isTeacher) {
                // 教員モード: クラス追加
                if (wrapper) wrapper.classList.add('teacher-mode');
                if (formTitle) formTitle.textContent = '教員アカウント作成';
            } else {
                // 生徒モード: クラス削除
                if (wrapper) wrapper.classList.remove('teacher-mode');
                if (formTitle) formTitle.textContent = '生徒アカウント作成';
            }
        });
    }

    const linkGuest = container.querySelector('#link-guest');
    const linkLogin = container.querySelector('#link-login');

const handleRegister = async (e) => {
        if (e) e.preventDefault();

        const errorDiv = container.querySelector('#register-error');
        const btnRegister = container.querySelector('#btn-register');
        if (errorDiv) errorDiv.textContent = '';

        // 入力値の取得
        const username = container.querySelector('#reg-username').value;
        const email = container.querySelector('#reg-email').value;
        const password = container.querySelector('#reg-password').value;
        const isTeacher = container.querySelector('#reg-role-toggle').checked;
        const role = isTeacher ? 'teacher' : 'student';

        try {
            if (btnRegister) {
                btnRegister.disabled = true;
                btnRegister.textContent = '登録中...';
            }

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '登録に失敗しました。');
            }

            // 成功: トークンとユーザー情報を保存
            if (data.token) {
                localStorage.setItem('vcl_token', data.token);
                localStorage.setItem('vcl_user', JSON.stringify(data.user));
            } else {
                // トークンが無い場合（バックエンドの修正が未反映など）はログイン画面へ誘導
                alert('アカウント作成に成功しました。ログインしてください。');
                navigateTo('login');
                return;
            }

            console.log('Registration successful:', data.user);
            navigateTo('/dashboard');

        } catch (error) {
            console.error('Registration error:', error);
            if (errorDiv) {
                errorDiv.textContent = error.message;
                if (error.message.includes('Failed to fetch')) {
                    errorDiv.textContent = 'サーバーに接続できません。バックエンドが起動しているか確認してください。';
                }
            } else {
                alert(error.message);
            }
        } finally {
            if (btnRegister) {
                btnRegister.disabled = false;
                btnRegister.textContent = 'アカウントを作成 🧪';
            }
        }
    };

    if (form) {
        form.addEventListener('submit', handleRegister);
    }

    if (linkGuest) {
        linkGuest.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Guest login');
            navigateTo('/dashboard');
        });
    }

    if (linkLogin) {
        linkLogin.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/login');
        });
    }

    return container;
}
