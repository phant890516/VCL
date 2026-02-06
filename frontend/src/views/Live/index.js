import './style.css';
import template from './template.html?raw';

export function LiveView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // 必要に応じてSocket接続処理などを記述

    return container;
}
