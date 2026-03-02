/**
 * ファイル名: frontend/src/views/Login/index.js
 * 概要: ログイン画面（View）の実装
 * 役割:
 *   - ユーザー認証フォームの表示
 *   - ログインAPIの呼び出しとトークン管理
 *   - ダッシュボードへの遷移制御
 */
import './style.css';
import template from './template.html?raw';

export function LoginView(navigateTo) {
    // コンテナ作成 (View共通のラッパーではなく、全画面表示のため個別に確保)
    const container = document.createElement('div');
    container.innerHTML = template;

    // 既にログイン済みならダッシュボードへ (簡易チェック)
    if (localStorage.getItem('vcl_token')) {
        // 即座に遷移するとレンダリングと競合する可能性があるのでsetTimeout
        setTimeout(() => navigateTo('/dashboard'), 0);
        return container;
    }

    const form = container.querySelector('#login-form');
    const errorDiv = container.querySelector('#login-error');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.textContent = '';

        const email = container.querySelector('#email').value;
        const password = container.querySelector('#password').value;
        const button = container.querySelector('.login-btn');

        try {
            button.disabled = true;
            button.textContent = '処理中...';

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // デモ用: バックエンドが動いていない場合のフォールバック（プレゼン等で止まらないように）
                // 本番では削除または適切なエラーハンドリングにする
                if (email === 'demo@example.com' && password === 'password123') {
                    console.warn('Backend seems down, using fallback login');
                    localStorage.setItem('vcl_token', 'mock_token');
                    localStorage.setItem('vcl_user', JSON.stringify({ username: 'Demo User', role: 'student' }));
                    navigateTo('/dashboard');
                    return;
                }

                throw new Error(data.error || 'ログインに失敗しました');
            }

            // 成功: トークンとユーザー情報を保存
            localStorage.setItem('vcl_token', data.token);
            localStorage.setItem('vcl_user', JSON.stringify(data.user));

            console.log('Login successful:', data.user);
            navigateTo('/dashboard');

        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message;

            // ネットワークエラー時の特別なメッセージ (バックエンド起動忘れ等を想定)
            if (error.message.includes('Failed to fetch')) {
                 errorDiv.textContent = 'サーバーに接続できません。バックエンドが起動しているか確認してください。(npm start in backend/)';
            }
        } finally {
            button.disabled = false;
            button.textContent = 'ログイン';
        }
    });

    // SPA遷移のためのリンク処理
    container.querySelectorAll('a[data-link]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const href = anchor.getAttribute('href');
            navigateTo(href);
        });
    });

    return container;
}
