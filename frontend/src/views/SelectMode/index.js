/**
 * ファイル名: frontend/src/views/SelectMode/index.js
 * 概要: 実験セレクトモード画面（View）
 * 役割:
 *   - 実施可能な実験リストの表示
 *   - 各実験の開始トリガー（Lab画面への遷移）
 */
import { experimentsData } from '../../data/experiments.js';
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

        experimentsData.forEach(exp => {
            const card = document.createElement('div');
            card.className = 'experiment-card';

            // 実験IDに基づいて色/グラデーションを決定
            const getGradient = (id) => {
                const gradients = {
                    'exp_01_o2': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', // 酸素 (青空)
                    'exp_02_co2': 'linear-gradient(135deg, #d7d2cc 0%, #304352 100%)', // CO2 (グレー/気体)
                    'exp_03_al': 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)', // アルミ (銀)
                    'exp_04_salt': 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)', // 食塩 (白)
                    'exp_05_nahco3': 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', // 重曹 (白粉末)
                    'exp_06_neutral': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // 中和 (フェノールフタレイン桃色)
                    'exp_07_lime': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // 石灰水 (薄紫/白濁)
                    'exp_08_mg': 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)', // マグネシウム燃焼 (白光)
                    'exp_09_ag': 'linear-gradient(135deg, #c33764 0%, #1d2671 100%)', // 硝酸銀 (深紅/沈殿)
                    'exp_10_cu': 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', // 銅 (赤褐色)
                    'exp_11_fe_s': 'linear-gradient(135deg, #434343 0%, #000000 100%)', // 鉄硫黄 (黒)
                    'exp_12_flame': 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)' // 炎色反応 (オレンジ/黄)
                };
                return gradients[id] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'; // デフォルト
            };

            const bgStyle = getGradient(exp.id);

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
                navigateTo('lab', { id, title });
            }
        });
    }

    return container;
}
