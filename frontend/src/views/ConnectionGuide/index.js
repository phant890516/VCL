import { io } from 'socket.io-client';
import { JoyConVisualizer } from './JoyCon3D.js';
import './style.css';
import template from './template.html?raw';

export function ConnectionGuideView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('connection-guide-view');
    container.innerHTML = template;

    const btnStart = container.querySelector('#btn-start-tutorial');

    // Visualizer Elements
    const statusBadge = container.querySelector('#status-badge');
    const badgeText = container.querySelector('.badge-text');
    const badgeDot = container.querySelector('.badge-dot');
    const angleValue = container.querySelector('#angle-value');

    // Step Cards
    const stepPair = container.querySelector('#step-pair');
    const stepConnect = container.querySelector('#step-connect');
    const stepMotion = container.querySelector('#step-motion');

    // 3D Visualizer Setup
    const visualizerContainer = container.querySelector('#joycon-3d-container');
    let visualizer = null;

    if (visualizerContainer) {
        setTimeout(() => {
             visualizer = new JoyConVisualizer(visualizerContainer);
        }, 100);
    }

    // Socket.io Connection
    const socket = io('http://localhost:3000');
    let isConnected = false;
    let initialAngle = null;

    // Helper to complete steps
    const completeStep = (element) => {
        if(element && !element.classList.contains('completed')) {
            element.classList.add('completed');
            // Change checkbox icon logic is handled via CSS
        }
    };

    // 接続状態の監視
    socket.on('connect', () => {
        console.log('Socket connected to backend');
        badgeText.textContent = '接続待機中...';
        statusBadge.className = 'connection-badge disconnected';
        if (visualizer) visualizer.setConnected(false);
    });

    socket.on('gyro-data', (data) => {
        // データが来たら「接続済み」とみなす
        if (!isConnected) {
            isConnected = true;
            badgeText.textContent = '接続完了';
            statusBadge.className = 'connection-badge connected';
            btnStart.disabled = false;

            // Mark steps 1 & 2 as done
            completeStep(stepPair);
            completeStep(stepConnect);

            // Visualizer state update
            if (visualizer) visualizer.setConnected(true);
        }

        // 角度をリアルタイム更新
        if (data && typeof data.angle === 'number') {
            const angle = data.angle;
            angleValue.textContent = `${angle.toFixed(1)}°`;

            if (visualizer) {
                visualizer.setRotation(angle);
            }

            // Check Step 3 (Motion)
            // If angle changes significantly or is non-zero (it usually is floating around)
            // Ideally we detect *movement*.
            // Simple logic: if we have initial angle, check diff.
            if (initialAngle === null) {
                initialAngle = angle;
            } else {
                const diff = Math.abs(angle - initialAngle);
                if (diff > 5.0) { // 5 degrees movement
                    completeStep(stepMotion);
                }
            }
        }
    });

    socket.on('disconnect', () => {
        isConnected = false;
        badgeText.textContent = 'サーバー切断';
        statusBadge.className = 'connection-badge disconnected';
        btnStart.disabled = true;
        if (visualizer) visualizer.setConnected(false);

        // Reset steps? Maybe keep them checked to not annoy user.
    });

    // イベントリスナー
    btnStart.addEventListener('click', () => {
        socket.disconnect(); // Clean up socket connection
        
        // ★実験開始ではなく「セレクトモード」へ遷移に変更
        navigateTo('/select-mode');
    });

    return container;
}
