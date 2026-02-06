import './style.css';
import template from './template.html?raw';

export function DashboardView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // カードクリックイベント
    const cardTutorial = container.querySelector('#card-tutorial');
    const cardSelect = container.querySelector('#card-select');
    const cardFree = container.querySelector('#card-free');

    // navigate('lab', { id: 'tutorial', title: 'チュートリアル' })
    if (cardTutorial) {
        cardTutorial.addEventListener('click', () => {
            navigateTo('lab', { id: 'tutorial', title: 'チュートリアル' });
        });
    }

    if (cardSelect) {
        cardSelect.addEventListener('click', () => {
            navigateTo('select-mode');
        });
    }

    if (cardFree) {
        cardFree.addEventListener('click', () => {
            navigateTo('free-mode');
        });
    }

    return container;
}
