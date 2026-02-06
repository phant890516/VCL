import { LabScene } from '../../scenes/LabScene.js';
import './style.css';
import template from './template.html?raw';

export function LabView(navigateTo, params = {}) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // タイトルの設定
    const titleEl = container.querySelector('#lab-title-display');
    if (titleEl) titleEl.textContent = params.title || 'フリー実験';

    // 3Dシーンの管理
    let labScene = null;
    let intervalId = null;

    // イベント設定
    const btnAbort = container.querySelector('#btn-lab-abort');
    const btnFinish = container.querySelector('#btn-lab-finish');

    if (btnAbort) {
        btnAbort.addEventListener('click', () => {
            if (confirm('実験を中断してホームに戻りますか？')) {
                clearInterval(intervalId);
                if (labScene) labScene.dispose();
                navigateTo('dashboard');
            }
        });
    }

    if (btnFinish) {
        btnFinish.addEventListener('click', () => {
            clearInterval(intervalId);
            if (labScene) labScene.dispose();
            // 成績画面へ
            navigateTo('result', { score: 'S' });
        });
    }

    // タイマー開始
    let seconds = 0;
    const timerEl = container.querySelector('#lab-timer');
    intervalId = setInterval(() => {
        // DOMがまだ存在するかチェック
        if (!document.body.contains(container)) {
            clearInterval(intervalId);
            if (labScene) labScene.dispose(); // DOM削除時にも念のため破棄
            return;
        }
        seconds++;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);

    // --- Three.js初期化 ---
    setTimeout(() => {
        // コンテナがDOMに追加されてからCanvas等を初期化する
        // template.htmlで追加したIDを探す
        const canvasContainer = container.querySelector('#three-canvas-container');
        if (canvasContainer) {
            labScene = new LabScene(canvasContainer);
        }
    }, 0);

    return container;
}
