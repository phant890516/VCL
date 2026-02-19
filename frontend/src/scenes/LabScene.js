import { io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * 実験室の3Dシーンを管理するクラス
 */
export class LabScene {
    /**
     * @param {HTMLElement} container - Canvasを配置する親要素
     */
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.testTubeGroup = null; // 試験管の操作用
        this.flaskGroup = null;    // フラスコの操作用
        this.animationId = null;
        this.resizeHandler = null;

        // 注ぐアニメーション用
        this.pouringParticles = [];
        this.isPouring = false;

        this.socket = null; // Socket.io endpoint
        this.targetRotationZ = 0; // ラグ軽減のための目標角度

        // キャリブレーション用
        this.calibrationOffset = 0;
        this.lastRawAngle = 0;
        this.angleHistory = []; // 平均化用バッファ
        this.keyDownHandler = null;

        this.debugDisplay = null; // デバッグ表示用エレメント

        // 初期化処理
        this.init();
    }

    init() {
        // デバッグ表示要素の取得
        this.debugDisplay = document.getElementById('debug-angle-display');

        // 1. シーン作成
        this.scene = new THREE.Scene();
        // 背景色（実験室っぽい色に設定してもよいが、一旦ダークグレー）
        this.scene.background = new THREE.Color(0x222222);

        // 2. カメラ作成
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            width / height,
            0.1, // Near
            1000 // Far
        );
        // カメラ位置を調整（グリッド全体が見えるように）
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        // 3. レンダラー作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // DOMに追加
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // 4. ライト設定
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(10, 20, 10);
        this.scene.add(pointLight);

        // 5. おーびっとこんとろーる
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // 慣性を持たせる
        this.controls.dampingFactor = 0.05;

        // 6. 要求されたグリッドの追加
        this.addGrid();

        // 7. 試験管を作成 (位置をずらす)
        this.testTubeGroup = this.createTestTube();
        // ★位置調整: フラスコインに注ぎやすい位置へ
        this.testTubeGroup.position.set(-2, 4.5, 0); // 左に配置
        this.scene.add(this.testTubeGroup);

        // 8. フラスコを作成
        this.flaskGroup = this.createFlask();
        this.flaskGroup.position.set(2, 0, 0); // 右に配置
        this.scene.add(this.flaskGroup);

        // 9. デバッグUIセットアップ（削除）
        // this.setupDebugUI();

        // リサイズイベント
        this.resizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

        // キーボードイベント (キャリブレーション用)
        this.keyDownHandler = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.keyDownHandler);

        // Socket接続設定
        this.setupSocketConnection();

        // アニメーションループ開始
        this.animate();
    }

    addGrid() {
        // グリッドヘルパー (size, divisions, colorCenterLine, colorGrid)
        const size = 20;
        const divisions = 20;
        const gridHelper = new THREE.GridHelper(size, divisions, 0x888888, 0x444444);
        gridHelper.position.y = 0; // 実験台の高さを0とする
        this.scene.add(gridHelper);

        // 軸も表示しておくと分かりやすい (X:赤, Y:緑, Z:青)
        const axesHelper = new THREE.AxesHelper(2);
        axesHelper.position.y = 0;
        this.scene.add(axesHelper);
    }

    createTestTube() {
        // グループ作成
        const group = new THREE.Group();

        // 1. ガラスのマテリアル
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.1,
            transmission: 0.9, // 透過
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide
        });

        // 2. 形状をパスで定義して回転体(LatheGeometry)を作成
        const points = [];
        const radius = 0.5;
        const height = 4.0;
        const segments = 10;

        // 底の半球部分
        for (let i = 0; i <= segments; i++) {
            const theta = (Math.PI / 2) * (i / segments);
            // xが半径方向、yが高さ方向。最初は(0, -radius)から始まり、(radius, 0)へ
            const x = Math.sin(theta) * radius;
            const y = -Math.cos(theta) * radius;
            points.push(new THREE.Vector2(x, y));
        }

        // 直立部分
        points.push(new THREE.Vector2(radius, height));

        // 縁（リム）
        const rimRadius = 0.15; // 少し厚め
        // 外側に広げる
        points.push(new THREE.Vector2(radius + rimRadius, height));
        points.push(new THREE.Vector2(radius + rimRadius, height + 0.15));
        points.push(new THREE.Vector2(radius, height + 0.15));

        // ジオメトリ作成
        const geometry = new THREE.LatheGeometry(points, 32);
        const testTube = new THREE.Mesh(geometry, glassMaterial);

        group.add(testTube);

        // 3. 中身の液体（オプション）
        // 半径を少し小さく、高さも調整
        const liquidRadius = radius - 0.05;
        const liquidHeight = height * 0.6; // 6割くらい

        const liquidGeometry = new THREE.CylinderGeometry(liquidRadius, liquidRadius, liquidHeight, 32);
        // 底を丸くするのは面倒なのでCylinderで簡易表現しつつ、位置調整
        liquidGeometry.translate(0, liquidHeight / 2 - radius, 0);

        // 液体のマテリアル（青色）
        const liquidMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00aaff,
            transmission: 0.5,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1
        });

        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        // 底の丸み部分にも液体を入れたい場合は球を追加するか、Latheで液体も作るのがベター
        // ここでは簡易的に球を追加
        const liquidBaseGeo = new THREE.SphereGeometry(liquidRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        liquidBaseGeo.rotateX(Math.PI); // 下向きにする
        liquidBaseGeo.translate(0, -radius, 0);
        const liquidBase = new THREE.Mesh(liquidBaseGeo, liquidMaterial);

        group.add(liquid);
        group.add(liquidBase);

        // this.scene.add(group); は呼び出し元で行うため削除し、returnする
        return group;
    }

    createFlask() {
        const group = new THREE.Group();

        // 共通ガラスマテリアル
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.1,
            transmission: 0.9,
            opacity: 0.5,
            transparent: true,
            side: THREE.DoubleSide
        });

        // 三角フラスコの形状 (LatheGeometry)
        const points = [];
        // 底面から首まで
        points.push(new THREE.Vector2(0, 0));
        points.push(new THREE.Vector2(1.5, 0));       // 底の半径
        points.push(new THREE.Vector2(1.4, 0.2));     // 少し丸み
        points.push(new THREE.Vector2(0.6, 2.5));     // 胴体から首の付け根へ
        points.push(new THREE.Vector2(0.6, 4.0));     // 首の上部まで垂直
        points.push(new THREE.Vector2(0.7, 4.0));     // リム（外へ）
        points.push(new THREE.Vector2(0.7, 4.2));     // リム（上へ）
        points.push(new THREE.Vector2(0.5, 4.2));     // リム（内へ）

        const geometry = new THREE.LatheGeometry(points, 32);
        const flaskMesh = new THREE.Mesh(geometry, glassMaterial);
        group.add(flaskMesh);

        // フラスコの中身（液体：赤色）
        // 簡易的に円錐台(Cylinder)で表現
        const liquidColor = 0xff0000;
        const liquidMat = new THREE.MeshPhysicalMaterial({
            color: liquidColor,
            transmission: 0.6,
            opacity: 0.8,
            transparent: true
        });

        // 底半径 ~1.4, 上面半径 ~1.0, 高さ 1.5 くらい
        const liquidGeo = new THREE.CylinderGeometry(0.9, 1.4, 1.5, 32);
        liquidGeo.translate(0, 0.75, 0); // 底を合わせる
        const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
        group.add(liquidMesh);

        return group;
    }

    onResize() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    }

    onKeyDown(event) {
        // 'C'キーで現在の角度を0度として補正（キャリブレーション）
        if (event.key.toLowerCase() === 'c') {
            this.calibrationOffset = this.lastRawAngle;
            console.log(`[LabScene] Calibrated! New Offset: ${this.calibrationOffset}`);
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        if (this.controls) {
            this.controls.update();
        }

        // --- 試験管の角度を滑らかに更新 (Lerp) ---
        if (this.testTubeGroup) {
            // 現在の角度から目標角度へ少しずつ近づける
            // 0.02(重すぎ) -> 0.08(適度な追従性) に変更。戻りすぎ（オーバーシュート）を防ぐため反応を良くする。
            this.testTubeGroup.rotation.z += (this.targetRotationZ - this.testTubeGroup.rotation.z) * 0.08;
        }

        // --- 注ぐモーションのロジック ---
        if (this.testTubeGroup) {
            // 現在のZ軸回転角度を取得 (ラジアン)
            const rotationZ = Math.abs(this.testTubeGroup.rotation.z);
            // 60度で流れるように変更 (変更前: 75度)
            const threshold = THREE.MathUtils.degToRad(60);

            if (rotationZ >= threshold) {
                this.isPouring = true;
                this.spawnPourParticle();
            } else {
                this.isPouring = false;
            }
        }

        this.updateParticles();
        // -----------------------------

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    spawnPourParticle() {
        // 試験管の口の位置を計算
        // グループ中心(0,0,0)からローカルY座標+4.0が口の位置（高さ4.0の試験管なので）
        // オフセットを考慮して座標変換
        const tipLocal = new THREE.Vector3(0.5, 4.0, 0); // 0.5は半径分、少し横から出るイメージ
        tipLocal.applyMatrix4(this.testTubeGroup.matrixWorld);

        // パーティクル生成 (簡易的な球Mesh)
        const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x00aaff }); // 試験管の中身と同じ色
        const pMesh = new THREE.Mesh(pGeo, pMat);

        pMesh.position.copy(tipLocal);

        // 速度ベクトルなどを持たせる
        pMesh.userData = {
            velocity: new THREE.Vector3(0, -0.1, 0), // 下に落ちる
            life: 60 // フレーム数で寿命管理
        };

        this.scene.add(pMesh);
        this.pouringParticles.push(pMesh);
    }

    updateParticles() {
        for (let i = this.pouringParticles.length - 1; i >= 0; i--) {
            const p = this.pouringParticles[i];

            // 位置更新
            p.position.add(p.userData.velocity);
            // 重力加速
            p.userData.velocity.y -= 0.01;

            // 寿命減少
            p.userData.life--;

            // フラスコの中に入ったら消える(y < 1.0)か、寿命切れで消える
            if (p.userData.life <= 0 || p.position.y < 1.0) {
                // 削除
                this.scene.remove(p);
                // メモリ解放
                p.geometry.dispose();
                p.material.dispose();
                this.pouringParticles.splice(i, 1);
            }
        }
    }

    setupSocketConnection() {
        // バックエンドに接続 (ハードコードされていますが、環境変数などが望ましい)
        this.socket = io('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log('Connected to backend socket');
        });

        // ESP32からのジャイロデータを受信
        this.socket.on('gyro-data', (data) => {
            // data.angle は -180 ~ 180 程度の値が入ると想定
            // 数値変換を確実に行う
            let angleVal = parseFloat(data.angle);
            if (this.testTubeGroup && !isNaN(angleVal)) {

                // 角度の正規化: 0~360度で来る場合も考慮して -180 ~ 180 に収める
                // これにより「右に傾けると350度になってしまい、反対側に回ろうとする」等を防ぐ
                while (angleVal <= -180) angleVal += 360;
                while (angleVal > 180) angleVal -= 360;

                this.lastRawAngle = angleVal; // 正規化後の値を保存

                // キャリブレーション補正
                let adjustedAngle = angleVal - this.calibrationOffset;

                // 補正後も再度正規化（オフセットで範囲外に出る可能性があるため）
                while (adjustedAngle <= -180) adjustedAngle += 360;
                while (adjustedAngle > 180) adjustedAngle -= 360;

                // --- 移動平均フィルタ (過去5フレームの平均に短縮してラグを減らす) ---
                this.angleHistory.push(adjustedAngle);
                if (this.angleHistory.length > 5) {
                    this.angleHistory.shift();
                }

                // 平均値を計算
                const averageAngle = this.angleHistory.reduce((sum, val) => sum + val, 0) / this.angleHistory.length;

                // 強力なデッドバンド: 直立付近(±5度)は完全に0にする
                let finalAngle = averageAngle;
                if (Math.abs(finalAngle) < 5.0) {
                    finalAngle = 0;
                }

                // --- 稼働範囲の制限 (角度制限) ---
                // 左に90度、右に90度以上は回らないようにする (物理的な限界をシミュレート)
                // マイナスが右回転の場合があるため、clampを使う
                // THREE.MathUtils.clamp(value, min, max)
                finalAngle = THREE.MathUtils.clamp(finalAngle, -120, 120);

                // もし「右側（マイナス方向）の反応が鈍い」と感じる場合、
                // センサーの取り付け向きによって、特定の範囲の値が飛んでいる可能性がある。
                // ここでは単純に角度制限を入れる。

                // 目標角度を更新
                this.targetRotationZ = THREE.MathUtils.degToRad(finalAngle);

                // デバッグ表示更新
                if (this.debugDisplay) {
                    this.debugDisplay.innerHTML = `
                        Raw: ${angleVal.toFixed(1)}°<br>
                        Adj: ${adjustedAngle.toFixed(1)}°<br>
                        Final: ${finalAngle.toFixed(1)}°
                    `;
                }

            } else {
                console.warn('Gyro update skipped:', { group: !!this.testTubeGroup, angle: data.angle });
            }
        });
    }

    /**
     * 画面遷移時などにリソースを解放する
     */
    dispose() {
        if (this.socket) {
            this.socket.disconnect();
        }

        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.controls) {
            this.controls.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();

            // DOMから削除
            if (this.container && this.renderer.domElement.parentNode === this.container) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
    }
}
