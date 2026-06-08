import './style.css';
import template from './template.html?raw';

export function NotFoundView(navigateTo) {
    const container = document.createElement('div');
    container.innerHTML = template;

    // 戻るボタンのイベントリスナー
    const btn = container.querySelector('#btn-back-home');
    if (btn) {
        btn.addEventListener('click', () => {
            // ホームへ戻る
            navigateTo('/');
        });
    }

    return container;
}
