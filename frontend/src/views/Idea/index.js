import './style.css';
import template from './template.html?raw';

export function IdeaView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    const bannerFree = container.querySelector('#banner-free-mode');
    if (bannerFree) {
        bannerFree.addEventListener('click', () => {
            navigateTo('free-mode'); // または 'lab' with free params
        });
    }

    const saveBtn = container.querySelector('#save-note-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('保存しました');
        });
    }

    return container;
}
