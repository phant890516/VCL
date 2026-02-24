// 必要なimportを追加
import '../../assets/periodicTable.css';

// --- Global State for Periodic Table ---
// LabViewの外で管理しないと、Viewの再描画などでリセットされる可能性があるが、
// index.js 内のスコープで十分。ただし、LabScene からのイベントフックが必要。

let isPeriodicOpen = false;
let currentFocusIndex = 0; // periodicTableLayout のインデックス
let overlayEl = null;
let detailedData = [];

// ... LabView の中で初期化 ...
export function LabView(navigateTo, params = {}) {
    // ... (既存コード) ...
    // Joy-Conイベントをフックするために、LabSceneにコールバックを渡すか、Socketを共有する必要がある
    // 現在の LabScene.js はSocket通信を内部で完結しているため、
    // LabView で Socket をlistenするか、LabScene に onJoyConInput を実装してもらうのが良い

    // しかし LabScene は canvas要素を受け取って初期化するだけなので、
    // ここで socket を直接 new するのは重複になる。
    // LabScene インスタンスから socket を参照できるならそれがベスト。
    // または window.socket を使うか。

    // 今回は LabScene.js に `onJoyConInput` コールバックを追加する方法をとる。

    labScene = new LabScene(canvasContainer);
    labScene.onJoyConInput = (data) => {
        if (!isPeriodicOpen) return; // 周期表が開いていない時は無視

        // スティック入力のチェック
        // data.sticks.left.x, y など
        // 閾値を超えたらカーソル移動

        const THRESHOLD = 0.5;
        if (data.sticks) {
            if (data.sticks.left.y < -THRESHOLD) moveCursor('up');
            if (data.sticks.left.y > THRESHOLD) moveCursor('down');
            if (data.sticks.left.x < -THRESHOLD) moveCursor('left');
            if (data.sticks.left.x > THRESHOLD) moveCursor('right');

            // 右スティックでも同様に
            if (data.sticks.right.y < -THRESHOLD) moveCursor('up');
            if (data.sticks.right.y > THRESHOLD) moveCursor('down');
            if (data.sticks.right.x < -THRESHOLD) moveCursor('left');
            if (data.sticks.right.x > THRESHOLD) moveCursor('right');
        }

        // ボタン入力
        // Bボタンで閉じる (Right byte3 & 0x04 ? check mapping)
        // Aボタンで決定
    };

    // ...
}
