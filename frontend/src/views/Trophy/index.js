import { getAcquiredTrophies, trophiesData } from '../../data/trophies.js';
import './style.css';
import template from './template.html?raw';

const UNLOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg>`;
const LOCKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`;

export function TrophyView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // 最新の獲得済みトロフィーリストを取得
    const acquiredIds = getAcquiredTrophies();

    const listContainer = container.querySelector('#trophy-list');

    // リストが空なら作成
    if (!listContainer) {
        console.error('Trophy list container not found');
        return container;
    }

    trophiesData.forEach(trophy => {
        const isAcquired = acquiredIds.includes(trophy.id);
        const item = document.createElement('div');

        // クラス名を設定 (獲得済みかどうかでスタイル分岐)
        // CSS側の .trophy-item-locked に対応させる
        item.className = `trophy-item ${isAcquired ? '' : 'trophy-item-locked'}`;

        // 1. アイコン部分
        const iconDiv = document.createElement('div');
        iconDiv.className = `trophy-icon ${isAcquired ? 'trophy-icon-unlocked' : 'trophy-icon-locked'}`;
        // アイコンはSVGを使用
        iconDiv.innerHTML = isAcquired ? UNLOCKED_ICON : LOCKED_ICON;

        // テキスト部分
        const contentDiv = document.createElement('div');
        contentDiv.className = 'trophy-content';

        const title = document.createElement('div');
        title.className = isAcquired ? 'trophy-title-text' : 'trophy-title-text-locked';
        title.textContent = trophy.title;

        const desc = document.createElement('div');
        desc.className = 'trophy-desc';
        desc.textContent = trophy.description;

        // ステータスバッジ
        const badge = document.createElement('span');
        badge.className = `trophy-status-badge ${isAcquired ? 'acquired' : 'locked'}`;
        badge.textContent = isAcquired ? 'ACQUIRED' : 'LOCKED';

        contentDiv.appendChild(title);
        contentDiv.appendChild(desc);
        contentDiv.appendChild(badge);

        item.appendChild(iconDiv);
        item.appendChild(contentDiv);

        listContainer.appendChild(item);
    });

    return container;
}
