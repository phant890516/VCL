import { EventEmitter } from 'events';
import HID from 'node-hid';

const VENDOR_ID = 0x057e;
const JOYCON_L_PRODUCT_ID = 0x2006;
const JOYCON_R_PRODUCT_ID = 0x2007;

// 単位変換係数
const ACCEL_SCALE = 4096.0;
const GYRO_SCALE = 16.4;
const CALIBRATION_SAMPLES = 200;
const DEAD_ZONE = 0.5;

export class JoyConService extends EventEmitter {
    constructor() {
        super();
        this.device = null;
        this.globalCounter = 0;

        // キャリブレーション用
        this.isCalibrating = true;
        this.calibrationData = { gyroX: 0, gyroY: 0, gyroZ: 0, count: 0 };
        this.offset = { gyroX: 0, gyroY: 0, gyroZ: 0 };

        // 角度計算用
        this.currentRoll = 0;
        this.lastRoll = 0;
    }

    connect() {
        const devices = HID.devices();

        console.log('--- Connected HID Devices ---');
        let foundJoyCon = false;
        devices.forEach(d => {
            if (d.vendorId === VENDOR_ID) {
                console.log(`Found Nintendo Device: PID 0x${d.productId.toString(16)} (${d.product}) Path: ${d.path}`);
                foundJoyCon = true;
            }
        });
        console.log('-----------------------------');

        const joyconInfo = devices.find(d =>
            d.vendorId === VENDOR_ID &&
            (d.productId === JOYCON_L_PRODUCT_ID || d.productId === JOYCON_R_PRODUCT_ID)
        );

        if (!joyconInfo) {
            console.log('❌ Joy-Con (VendorID 0x057e) が見つかりません。');
            console.log('   対策: Bluetooth設定で「Joy-Con」を削除し、再ペアリングしてください。');
            return;
        }

        try {
            this.device = new HID.HID(joyconInfo.path);
            console.log(`✅ Connected to Joy-Con: ${joyconInfo.product}`);
            console.log('⏳ Starting Calibration (Keep device still for a few seconds)...');

            this.device.on('data', (data) => {
                this.handleData(data);
            });

            this.device.on('error', (err) => {
                console.error('Joy-Con error:', err);
                this.emit('disconnect');
            });

            this.initJoyCon();

        } catch (e) {
            console.error('Failed to open Joy-Con device:', e);
        }
    }

    initJoyCon() {
        if (!this.device) return;

        console.log('Initializing Joy-Con...');

        // 1. Rumble有効化 + IMU有効化
        this.sendCommand(0x40, [0x01]);
        console.log('Sent: Enable IMU (0x40)');

        // 2. モード変更 (Standard Full Mode)
        setTimeout(() => {
            this.sendCommand(0x03, [0x30]);
            console.log('Sent: Switch to Standard Full Mode (0x30)');
        }, 100);
    }

    sendCommand(subcommand, args) {
        if (!this.device) return;

        // グローバルカウンタ: 0x0 から 0xF まで循環
        this.globalCounter = (this.globalCounter + 1) & 0xF;

        const rumbleData = [0x00, 0x01, 0x40, 0x40, 0x00, 0x01, 0x40, 0x40];

        const buffer = [
            0x01,               // Report ID
            this.globalCounter,
            ...rumbleData,
            subcommand,
            ...args
        ];

        // 64バイトパディング
        while(buffer.length < 49) buffer.push(0);

        try {
            this.device.write(buffer);
        } catch(e) {
            console.error('Write error:', e);
        }
    }


    handleData(data) {
        if (!Buffer.isBuffer(data)) data = Buffer.from(data);

        // データが0x30レポートの標準サイズ(49バイト)より小さい場合は無視
        if (data.length < 49) return;

        let processed = false;

        for (let i = 0; i < data.length - 48; i++) {
            // Report ID が 0x30 の場所を探す
            if (data[i] === 0x30) {
                const report = data.slice(i, i + 49);
                this.processReport0x30(report);
                processed = true;
                i += 48;
            }
        }
    }

    processReport0x30(data) {
        const readInt16LE = (offset) => {
            return data.readInt16LE(offset);
        };

        // ボタンデータの解析
        const b3 = data[3];
        const buttonsRight = {
            y:  !!(b3 & 0x01),
            x:  !!(b3 & 0x02),
            b:  !!(b3 & 0x04),
            a:  !!(b3 & 0x08),
            sr: !!(b3 & 0x10),
            sl: !!(b3 & 0x20),
            r:  !!(b3 & 0x40),
            zr: !!(b3 & 0x80)
        };

        const b4 = data[4];
        const buttonsShared = {
            minus:   !!(b4 & 0x01),
            plus:    !!(b4 & 0x02),
            rStick:  !!(b4 & 0x04),
            lStick:  !!(b4 & 0x08),
            home:    !!(b4 & 0x10),
            capture: !!(b4 & 0x20)
        };

        const b5 = data[5];
        const buttonsLeft = {
            down:  !!(b5 & 0x01),
            up:    !!(b5 & 0x02),
            right: !!(b5 & 0x04),
            left:  !!(b5 & 0x08),
            sr:    !!(b5 & 0x10),
            sl:    !!(b5 & 0x20),
            l:     !!(b5 & 0x40),
            zl:    !!(b5 & 0x80)
        };

        const buttons = {
            byte3: data[3], byte4: data[4], byte5: data[5],
            parsed: { right: buttonsRight, shared: buttonsShared, left: buttonsLeft }
        };

        // アナログスティック読み取り (12bit packed)
        // Left Stick: Bytes 6, 7, 8
        const l0 = data[6];
        const l1 = data[7];
        const l2 = data[8];
        const stickLX = l0 | ((l1 & 0x0F) << 8);
        const stickLY = ((l1 & 0xF0) >> 4) | (l2 << 4);

        // Right Stick: Bytes 9, 10, 11
        const r0 = data[9];
        const r1 = data[10];
        const r2 = data[11];
        const stickRX = r0 | ((r1 & 0x0F) << 8);
        const stickRY = ((r1 & 0xF0) >> 4) | (r2 << 4);

        // 正規化 (-1.0 to 1.0)
        // Center is approx 2048 (0x800). Range is 0 - 4095.
        // Y軸は上が大きい値かと思いきや、Joy-Conの仕様を確認する必要があるが、
        // 多くのゲームパッドでは上はマイナス、あるいはプラス。
        // ここではとりあえず 0-4095 を -1 から 1 に正規化する。
        // 実際にはキャリブレーションデータが必要だが、簡易的に計算。

        const normalize = (val) => (val - 2048) / 2048;

        const sticks = {
            left: { x: normalize(stickLX), y: normalize(stickLY) },
            right: { x: normalize(stickRX), y: normalize(stickRY) }
        };

        // 3つのサンプルフレーム
        let sumAccel = { x: 0, y: 0, z: 0 };
        let sumGyro = { x: 0, y: 0, z: 0 };
        const samples = [13, 25, 37];

        samples.forEach(offset => {
            sumAccel.x += readInt16LE(offset);
            sumAccel.y += readInt16LE(offset + 2);
            sumAccel.z += readInt16LE(offset + 4);

            sumGyro.x += readInt16LE(offset + 6);
            sumGyro.y += readInt16LE(offset + 8);
            sumGyro.z += readInt16LE(offset + 10);
        });

        // 平均値 (Raw)
        const rawAccel = {
            x: sumAccel.x / 3,
            y: sumAccel.y / 3,
            z: sumAccel.z / 3
        };

        const rawGyro = {
            x: sumGyro.x / 3,
            y: sumGyro.y / 3,
            z: sumGyro.z / 3
        };

        if (this.isCalibrating) {
            this.calibrationData.gyroX += rawGyro.x;
            this.calibrationData.gyroY += rawGyro.y;
            this.calibrationData.gyroZ += rawGyro.z;
            this.calibrationData.count++;

            if (this.calibrationData.count >= CALIBRATION_SAMPLES) {
                this.offset.gyroX = this.calibrationData.gyroX / CALIBRATION_SAMPLES;
                this.offset.gyroY = this.calibrationData.gyroY / CALIBRATION_SAMPLES;
                this.offset.gyroZ = this.calibrationData.gyroZ / CALIBRATION_SAMPLES;

                this.isCalibrating = false;
                console.log('✅ Calibration Complete!');
                console.log('Offsets:', this.offset);
            }
            return;
        }

        // Convert and Apply Offsets
        const accel = {
            x: rawAccel.x / ACCEL_SCALE,
            y: rawAccel.y / ACCEL_SCALE,
            z: rawAccel.z / ACCEL_SCALE
        };

        const gyro = {
            x: (rawGyro.x - this.offset.gyroX) / GYRO_SCALE,
            y: (rawGyro.y - this.offset.gyroY) / GYRO_SCALE,
            z: (rawGyro.z - this.offset.gyroZ) / GYRO_SCALE
        };

        // デッドゾーン処理
        if (Math.abs(gyro.x) < DEAD_ZONE) gyro.x = 0;
        if (Math.abs(gyro.y) < DEAD_ZONE) gyro.y = 0;
        if (Math.abs(gyro.z) < DEAD_ZONE) gyro.z = 0;

        // 角度計算 (Complementary Filter)
        const dt = 0.015; // 60Hz approx
        const FILTER_COEFFICIENT = 0.96;
        const MOVE_SCALE_FACTOR = 1.0;
        const DEG_TO_RAD = Math.PI / 180;

        // Gyro Z (Roll) - 符号を検証して適用 (main.jsのロジックに準拠)
        // main.jsでは: const gyroZ = data.gyro.z * DEG_TO_RAD * MOVE_SCALE_FACTOR;
        // ジャイロの回転方向が逆の場合は符号を反転させる必要があるが、まずはそのまま適用
        const gyroZ_rad = gyro.z * DEG_TO_RAD * MOVE_SCALE_FACTOR;

        // Accel Roll
        // Joy-Conを立てて持った状態 (Yが上) を基準にする
        // main.jsのロジック:
        // let roll = Math.atan2(ax, ay);
        // roll -= (Math.PI / 2);

        let accelRoll = Math.atan2(accel.x, accel.y);

        // 初期値補正: 垂直持ちで0度になるように調整
        // Math.atan2(0, 1) = 0 (Y軸上が正) → 垂直持ち
        // そのまま使うと Joy-Con の向きによっては 90度ずれるため、main.js に合わせる
        accelRoll -= (Math.PI / 2);

        // 正規化 (-PI ~ PI)
        while (accelRoll <= -Math.PI) accelRoll += 2 * Math.PI;
        while (accelRoll > Math.PI) accelRoll -= 2 * Math.PI;

        // 角度制限 (左右120度 = 約2.1ラジアン)
        const MAX_ANGLE = 120 * DEG_TO_RAD;
        if (accelRoll > MAX_ANGLE) accelRoll = MAX_ANGLE;
        if (accelRoll < -MAX_ANGLE) accelRoll = -MAX_ANGLE;

        // Init if undefined
        if (this.currentRoll === undefined) this.currentRoll = accelRoll;

        // Filter: Right tilt should be negative or positive depending on coord system.
        // In Three.js: Right tilt is typically negative rotation around Z.
        // main.js: newRoll = (FILTER * (curr + gyro * dt)) + (1-FILTER)*accel

        this.currentRoll = (FILTER_COEFFICIENT * (this.currentRoll + gyroZ_rad * dt)) +
                      ((1 - FILTER_COEFFICIENT) * accelRoll);

        // 角度飛び防止
        if (Math.abs(this.currentRoll - (this.lastRoll || 0)) > 1.0) this.currentRoll = accelRoll;
        this.lastRoll = this.currentRoll;

        // Emit calculated angle for simpler frontend consumption
        // 符号を反転させる (右傾きを右回転へ)
        // Joy-Conの座標系とThree.jsの座標系(右手系)の不一致をここで吸収
        // ユーザー報告「右に傾けたら左になる」→ 符号を反転して送る
        const angleDeg = -(this.currentRoll * (180 / Math.PI));

        // Debug log (occasionally)
        if (Math.random() < 0.01) {
             console.log(`[JoyCon] Angle: ${angleDeg.toFixed(1)}° (Roll: ${this.currentRoll.toFixed(2)})`);
        }

        // Also emit raw data if needed
        this.emit('change', {
            buttons,
            accel,
            gyro,
            angle: angleDeg, // Include calculated angle
            sticks // 追加: スティックデータ
        });
    }
}
