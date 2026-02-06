import { trophiesData } from '../../data/trophies.js';
import './style.css';
import template from './template.html?raw';

const UNLOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>`;
const LOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`;

// モックの獲得状況 (本来はバックエンドやローカルストレージから取得)
const ACQUIRED_IDS = ['initial_login', 'precise_mixing'];

export function TrophyView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    const listContainer = container.querySelector('#trophy-list');

    trophiesData.forEach(trophy => {
        const isAcquired = ACQUIRED_IDS.includes(trophy.id);
        const item = document.createElement('div');

        item.className = `trophy-item ${isAcquired ? '' : 'trophy-item-locked'}`;

        const iconSpan = document.createElement('span');
        iconSpan.className = `trophy-icon ${isAcquired ? '' : 'trophy-icon-locked'}`;
        iconSpan.innerHTML = isAcquired ? UNLOCKED_ICON : LOCKED_ICON;

        const infoDiv = document.createElement('div');

        const titleStrong = document.createElement('strong');
        titleStrong.className = isAcquired ? 'trophy-title-text' : '';
        titleStrong.textContent = trophy.title;

        const br1 = document.createElement('br');

        const descSmall = document.createElement('small');
        descSmall.className = 'trophy-desc';
        descSmall.textContent = `条件: ${trophy.description}`;

        const br2 = document.createElement('br');

        const statusSpan = document.createElement('span');
        if (isAcquired) {
            statusSpan.className = 'trophy-date';
            statusSpan.textContent = '[獲得済] 2026/02/05'; // 仮の日付
        } else {
            statusSpan.className = 'trophy-status-locked';
            statusSpan.textContent = '[未獲得]';
        }

        infoDiv.appendChild(titleStrong);
        infoDiv.appendChild(br1);
        infoDiv.appendChild(descSmall);
        infoDiv.appendChild(br2);
        infoDiv.appendChild(statusSpan);

        item.appendChild(iconSpan);
        item.appendChild(infoDiv);

        listContainer.appendChild(item);
    });

    return container;
}
