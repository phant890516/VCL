/**
 * ファイル名: frontend/src/views/Trophy/index.js
 * 概要: トロフィー一覧画面（View）の実装
 * 役割:
 *   - 獲得済みトロフィーと未獲得トロフィーの一覧表示
 *   - 獲得状況に応じたスタイリングとバッジ表示
 */
import { getAcquiredTrophies, trophiesData } from '../../data/trophies.js';
import './style.css';
import template from './template.html?raw';

function showListStatus(listContainer, message, isError = false) {
    const status = document.createElement('div');
    status.className = isError ? 'trophy-list-status error' : 'trophy-list-status';
    status.textContent = message;
    listContainer.replaceChildren(status);
}

export function TrophyView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    const listContainer = container.querySelector('#trophy-list');
    const itemTemplate = container.querySelector('#trophy-item-template');

    // リストが空なら作成
    if (!listContainer || !itemTemplate) {
        console.error('Trophy list container not found');
        return container;
    }

    // ローディング表示
    showListStatus(listContainer, '読み込み中...');

    // 最新の獲得済みトロフィーリストを取得 (非同期)
    getAcquiredTrophies().then(acquiredIds => {
        listContainer.replaceChildren(); // ローディング消去

        trophiesData.forEach(trophy => {
            const isAcquired = acquiredIds.includes(trophy.id);
            const item = itemTemplate.content.firstElementChild.cloneNode(true);
            const iconDiv = item.querySelector('.trophy-icon');
            const title = item.querySelector('.trophy-title');
            const desc = item.querySelector('.trophy-desc');
            const badge = item.querySelector('.trophy-status-badge');

            item.classList.toggle('trophy-item-locked', !isAcquired);
            iconDiv.classList.add(isAcquired ? 'trophy-icon-unlocked' : 'trophy-icon-locked');
            item.querySelector('.trophy-icon-svg-unlocked').hidden = !isAcquired;
            item.querySelector('.trophy-icon-svg-locked').hidden = isAcquired;
            title.className = isAcquired ? 'trophy-title trophy-title-text' : 'trophy-title trophy-title-text-locked';
            title.textContent = trophy.title;
            desc.textContent = trophy.description;
            badge.classList.add(isAcquired ? 'acquired' : 'locked');
            badge.textContent = isAcquired ? 'ACQUIRED' : 'LOCKED';

            listContainer.appendChild(item);
        });
    }).catch(err => {
        showListStatus(listContainer, `エラーが発生しました: ${err.message}`, true);
    });

    return container;
}
