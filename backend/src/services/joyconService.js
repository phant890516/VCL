import { EventEmitter } from 'events';
import HID from 'node-hid';

const VENDOR_ID = 0x057e;
const JOYCON_L_PRODUCT_ID = 0x2006;
const JOYCON_R_PRODUCT_ID = 0x2007;

const ACCEL_SCALE = 4096.0;
const GYRO_SCALE = 16.4;
const CALIBRATION_SAMPLES = 200;
const DEAD_ZONE = 0.5;

const POLLING_INTERVAL_MS = 2000;

export class JoyConService extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
        this.globalCounter = 0;
        this.pollingTimer = null;
        this.joyconCounter = 0;
    }

    start() {
        if (this.pollingTimer) return;
        console.log(`Joy-Conサービスを開始します(監視間隔: ${POLLING_INTERVAL_MS}ms)`);
        this.tryConnect();
        this.pollingTimer = setInterval(() => {
            this.tryConnect();
        }, POLLING_INTERVAL_MS);
    }

    stop() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
        for (const [path, info] of this.devices.entries()) {
            this.handleDisconnect(path);
        }
    }

    tryConnect() {
        try {
            const hidDevices = HID.devices();
            const joycons = hidDevices.filter(d =>
                (d.vendorId === VENDOR_ID) &&
                (d.productId === JOYCON_L_PRODUCT_ID || d.productId === JOYCON_R_PRODUCT_ID)
            );

            for (const jc of joycons) {
                if (jc.path && !this.devices.has(jc.path)) {
                    console.log(`🎮 Joy-Con発見: ${jc.product} (Path: ${jc.path})`);
                    try {
                        const device = new HID.HID(jc.path);
                        const isLeft = (jc.productId === JOYCON_L_PRODUCT_ID);
                        const index = this.joyconCounter++;
                        
                        const state = {
                            isLeftJoyCon: isLeft,
                            isCalibrating: true,
                            calibrationData: { gyroX: 0, gyroY: 0, gyroZ: 0, count: 0 },
                            offset: { gyroX: 0, gyroY: 0, gyroZ: 0 },
                            currentRoll: undefined,
                            lastRoll: 0
                        };

                        this.devices.set(jc.path, { device, state, index, product: jc.product });
                        console.log(`🎮 デバイスタイプ: Joy-Con (${isLeft ? 'L' : 'R'}) -> Index: ${index}`);

                        device.on('data', (data) => {
                            this.handleData(data, jc.path);
                        });

                        device.on('error', (err) => {
                            console.error(`🔴 Joy-Con通信エラー (切断検知 path: ${jc.path}):`, err);
                            this.handleDisconnect(jc.path);
                        });

                        this.initJoyCon(jc.path);
                        this.emit('connected', { product: jc.product, index });
                        console.log(`⏳ キャリブレーションを開始します(${index}) 数秒間静置してください...`);
                    } catch (connErr) {
                        console.error('Joy-Con接続エラー:', connErr);
                        this.handleDisconnect(jc.path);
                    }
                }
            }
        } catch (e) {
            console.error('デバイススキャンエラー:', e);
        }
    }

    handleDisconnect(path) {
        if (this.devices.has(path)) {
            const { device, index } = this.devices.get(path);
            try {
                device.removeAllListeners('data');
                device.removeAllListeners('error');
                device.close();
            } catch (e) {}
            this.devices.delete(path);
            console.log(`🔌 Joy-Con切断 (Index: ${index}). 再接続待機中...`);
            this.emit('disconnect', { index });
            
            if (this.devices.size === 0) {
                this.joyconCounter = 0;
            }
        }
    }

    connect() {
        this.start();
    }

    initJoyCon(path) {
        if (!this.devices.has(path)) return;
        const { device } = this.devices.get(path);
        
        console.log(`Initializing Joy-Con (${path})...`);
        this.sendCommand(device, 0x40, [0x01]);
        
        setTimeout(() => {
            if (this.devices.has(path)) {
                this.sendCommand(this.devices.get(path).device, 0x03, [0x30]);
            }
        }, 100);
    }

    sendCommand(device, subcommand, args) {
        this.globalCounter = (this.globalCounter + 1) & 0xF;
        const rumbleData = [0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40];
        const buffer = [
            0x01,
            this.globalCounter,
            ...rumbleData,
            subcommand,
            ...args
        ];
        while(buffer.length < 49) buffer.push(0);
        try {
            device.write(buffer);
        } catch(e) {}
    }

    handleData(data, path) {
        if (!this.devices.has(path)) return;
        if (!Buffer.isBuffer(data)) data = Buffer.from(data);
        if (data.length < 49) return;

        for (let i = 0; i < data.length - 48; i++) {
            if (data[i] === 0x30) {
                const report = data.slice(i, i + 49);
                this.processReport0x30(report, path);
                i += 48;
            }
        }
    }

    processReport0x30(data, path) {
        const info = this.devices.get(path);
        if (!info) return;
        const { state, index } = info;
        const readInt16LE = (offset) => data.readInt16LE(offset);

        // Buttons parsing
        const b3 = data[3];
        const buttonsRight = { y: !!(b3 & 0x01), x: !!(b3 & 0x02), b: !!(b3 & 0x04), a: !!(b3 & 0x08), sr: !!(b3 & 0x10), sl: !!(b3 & 0x20), r: !!(b3 & 0x40), zr: !!(b3 & 0x80) };
        const b4 = data[4];
        const buttonsShared = { minus: !!(b4 & 0x01), plus: !!(b4 & 0x02), rStick: !!(b4 & 0x04), lStick: !!(b4 & 0x08), home: !!(b4 & 0x10), capture: !!(b4 & 0x20) };
        const b5 = data[5];
        const buttonsLeft = { down: !!(b5 & 0x01), up: !!(b5 & 0x02), right: !!(b5 & 0x04), left: !!(b5 & 0x08), sr: !!(b5 & 0x10), sl: !!(b5 & 0x20), l: !!(b5 & 0x40), zl: !!(b5 & 0x80) };
        
        const buttons = {
            byte3: data[3], byte4: data[4], byte5: data[5],
            parsed: { right: buttonsRight, shared: buttonsShared, left: buttonsLeft }
        };

        const l0 = data[6], l1 = data[7], l2 = data[8];
        const stickLX = l0 | ((l1 & 0x0F) << 8);
        const stickLY = ((l1 & 0xF0) >> 4) | (l2 << 4);

        const r0 = data[9], r1 = data[10], r2 = data[11];
        const stickRX = r0 | ((r1 & 0x0F) << 8);
        const stickRY = ((r1 & 0xF0) >> 4) | (r2 << 4);

        const normalize = (val) => (val - 2048) / 2048;
        const sticks = {
            left: { x: normalize(stickLX), y: normalize(stickLY) },
            right: { x: normalize(stickRX), y: normalize(stickRY) }
        };

        let sumAccel = { x: 0, y: 0, z: 0 };
        let sumGyro = { x: 0, y: 0, z: 0 };
        const samples = [13, 25, 37];

        samples.forEach(offset => {
            sumAccel.x += readInt16LE(offset); sumAccel.y += readInt16LE(offset + 2); sumAccel.z += readInt16LE(offset + 4);
            sumGyro.x += readInt16LE(offset + 6); sumGyro.y += readInt16LE(offset + 8); sumGyro.z += readInt16LE(offset + 10);
        });

        const rawAccel = { x: sumAccel.x / 3, y: sumAccel.y / 3, z: sumAccel.z / 3 };
        const rawGyro = { x: sumGyro.x / 3, y: sumGyro.y / 3, z: sumGyro.z / 3 };

        if (state.isCalibrating) {
            state.calibrationData.gyroX += rawGyro.x;
            state.calibrationData.gyroY += rawGyro.y;
            state.calibrationData.gyroZ += rawGyro.z;
            state.calibrationData.count++;
            if (state.calibrationData.count >= CALIBRATION_SAMPLES) {
                state.offset.gyroX = state.calibrationData.gyroX / CALIBRATION_SAMPLES;
                state.offset.gyroY = state.calibrationData.gyroY / CALIBRATION_SAMPLES;
                state.offset.gyroZ = state.calibrationData.gyroZ / CALIBRATION_SAMPLES;
                state.isCalibrating = false;
                console.log(`✅ Calibration Complete for Joy-Con ${index}! offsets:`, state.offset);
            }
            return;
        }

        const accel = { x: rawAccel.x / ACCEL_SCALE, y: rawAccel.y / ACCEL_SCALE, z: rawAccel.z / ACCEL_SCALE };
        if (state.isLeftJoyCon) {
            accel.y = -accel.y;
            accel.x = -accel.x;
        }

        const gyro = {
            x: (rawGyro.x - state.offset.gyroX) / GYRO_SCALE,
            y: (rawGyro.y - state.offset.gyroY) / GYRO_SCALE,
            z: (rawGyro.z - state.offset.gyroZ) / GYRO_SCALE
        };

        if (Math.abs(gyro.x) < DEAD_ZONE) gyro.x = 0;
        if (Math.abs(gyro.y) < DEAD_ZONE) gyro.y = 0;
        if (Math.abs(gyro.z) < DEAD_ZONE) gyro.z = 0;

        const dt = 0.015;
        const FILTER_COEFFICIENT = 0.96;
        const DEG_TO_RAD = Math.PI / 180;
        const gyroZ_rad = gyro.z * DEG_TO_RAD;

        let accelRoll = Math.atan2(accel.x, accel.y);
        accelRoll -= (Math.PI / 2);

        while (accelRoll <= -Math.PI) accelRoll += 2 * Math.PI;
        while (accelRoll > Math.PI) accelRoll -= 2 * Math.PI;

        const MAX_ANGLE = 120 * DEG_TO_RAD;
        if (accelRoll > MAX_ANGLE) accelRoll = MAX_ANGLE;
        if (accelRoll < -MAX_ANGLE) accelRoll = -MAX_ANGLE;

        if (state.currentRoll === undefined) state.currentRoll = accelRoll;
        state.currentRoll = (FILTER_COEFFICIENT * (state.currentRoll + gyroZ_rad * dt)) + ((1 - FILTER_COEFFICIENT) * accelRoll);

        if (Math.abs(state.currentRoll - (state.lastRoll || 0)) > 1.0) state.currentRoll = accelRoll;
        state.lastRoll = state.currentRoll;

        const angleDeg = -(state.currentRoll * (180 / Math.PI));

        if (Math.random() < 0.01) {
             console.log(`[JoyCon ${index}] Angle: ${angleDeg.toFixed(1)}°`);
        }

        this.emit('change', {
            joyconIndex: index,
            buttons,
            accel,
            gyro,
            angle: angleDeg,
            sticks
        });
    }
}
