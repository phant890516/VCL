import './style.css';
import template from './template.html?raw';

export function RegisterView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // イベントリスナー設定
    const btnLogin = container.querySelector('#btn-login');
    const linkGuest = container.querySelector('#link-guest');

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        // ここで実際のログイン処理を行う
        console.log('Login clicked');
        navigateTo('dashboard');
    };

    if (btnLogin) btnLogin.addEventListener('click', handleLogin);
    if (linkGuest) linkGuest.addEventListener('click', handleLogin);

    return container;
}
