import fetch from 'node-fetch';

const PORT = 3000;
// Windows環境での安定性のため 127.0.0.1 を使用
const URL = `http://127.0.0.1:${PORT}/gyro`;

async function sendGyroData(angle) {
    try {
        const body = {
            id: "test-script",
            angle: angle
        };

        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const json = await response.json();
        console.log(`Sent angle: ${angle}, Response: ${response.status}`, json);
    } catch (error) {
        console.error('Error sending data:', error.message);
    }
}

// Simulate a wave
let angle = -45;
let direction = 1;

console.log('Starting Gyro Simulation...');
console.log(`Target URL: ${URL}`);

setInterval(() => {
    sendGyroData(angle);

    angle += direction * 5;
    if (angle > 45) direction = -1;
    if (angle < -45) direction = 1;
}, 500);
