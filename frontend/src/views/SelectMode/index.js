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

    if (listContainer) {
        // Clear just in case, though it should be empty
        listContainer.innerHTML = '';

        quests.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'experiment-card';

            const bgStyle = exp.visual?.gradient || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';

            const isAvailable = exp.available !== false; // デフォルトはtrue

            // 安全なHTML構築のため、テンプレートリテラルを使用
            card.innerHTML = `
                <div class="card-image" style="background: ${bgStyle}; ${!isAvailable ? 'filter: grayscale(100%);' : ''}"></div>
                <div class="card-content">
                    <h3>${exp.title}</h3>
                    <div class="difficulty-badge">使用物質: ${exp.materials}</div>
                    <p>${exp.desc}</p>
                    <button class="start-btn"
                        data-id="${exp.id}"
                        data-title="${exp.title}"
                        ${!isAvailable ? 'disabled style="background: #ccc; cursor: not-allowed;"' : ''}
                    >
                        ${isAvailable ? '実験開始' : 'Coming Soon'}
                    </button>
                </div>
            `;
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
