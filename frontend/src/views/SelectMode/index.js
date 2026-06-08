/**
 * ファイル名: frontend/src/views/SelectMode/index.js
 * 概要: 実験セレクトモード画面（View）
 * 役割:
 *   - 実施可能な実験リストの表示
 *   - 各実験の開始トリガー（Lab画面への遷移）
 */
import { quests } from '../../data/quests.js';
import './style.css';
import template from './template.html?raw';

export function SelectModeView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    const listContainer = container.querySelector('#experiment-list-container');
    const cardTemplate = container.querySelector('#experiment-card-template');

    if (listContainer && cardTemplate) {
        // Clear just in case, though it should be empty
        listContainer.replaceChildren();

        quests.forEach(exp => {
            const card = cardTemplate.content.firstElementChild.cloneNode(true);
            const bgStyle = exp.visual?.gradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
            const isAvailable = exp.available !== false; // デフォルトはtrue
            const image = card.querySelector('.card-image');
            const title = card.querySelector('.experiment-title');
            const materials = card.querySelector('.difficulty-badge');
            const description = card.querySelector('.experiment-description');
            const button = card.querySelector('.start-btn');

            image.style.background = bgStyle;
            if (!isAvailable) image.style.filter = 'grayscale(100%)';
            title.textContent = exp.title;
            materials.textContent = `使用物質: ${exp.materials}`;
            description.textContent = exp.desc;
            button.dataset.id = exp.id;
            button.dataset.title = exp.title;
            button.textContent = isAvailable ? '実験開始' : 'Coming Soon';
            if (!isAvailable) {
                button.disabled = true;
                button.classList.add('disabled');
            }
            listContainer.appendChild(card);
        });

        // イベントデリゲーションでボタンクリックを処理
        listContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-btn')) {
                const id = e.target.dataset.id;
                const title = e.target.dataset.title;
                console.log(`Navigating to Lab: ${title} (${id})`);
                navigateTo('/lab', { id, title });
            }
        });
    }

    return container;
}
