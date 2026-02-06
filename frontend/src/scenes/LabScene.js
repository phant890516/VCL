import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

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
        this.gui = null; // デバッグUI
        this.testTubeGroup = null; // 試験管の操作用
        this.flaskGroup = null;    // フラスコの操作用
        this.animationId = null;
        this.resizeHandler = null;

        // 注ぐアニメーション用
        this.pouringParticles = [];
        this.isPouring = false;

        // 初期化処理
        this.init();
    }

    init() {
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
        // ★位置調整: フラスコに注ぎやすい位置へ (回転時にフラスコの口に来るように)
        this.testTubeGroup.position.set(2, 4.5, 0);
        this.scene.add(this.testTubeGroup);

        // 8. フラスコを作成
        this.flaskGroup = this.createFlask();
        this.flaskGroup.position.set(-2, 0, 0); // 左に配置
        this.scene.add(this.flaskGroup);

        // 9. デバッグUIセットアップ
        this.setupDebugUI();

        // リサイズイベント
        this.resizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

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

    setupDebugUI() {
        this.gui = new GUI({ width: 300 });
        const debugObj = {
            testTubeAngle: 0,
            reset: () => {
                debugObj.testTubeAngle = 0;
                if (this.testTubeGroup) {
                    this.testTubeGroup.rotation.z = 0;
                }
            }
        };

        const folder = this.gui.addFolder('Laboratory Controls');

        folder.add(debugObj, 'testTubeAngle', 0, 180).name('Test Tube Angle (deg)')
            .onChange((value) => {
                if (this.testTubeGroup) {
                    // Z軸回転で傾ける（マイナス方向に回すと左に倒れるイメージ）
                    this.testTubeGroup.rotation.z = THREE.MathUtils.degToRad(value);
                }
            });

        folder.add(debugObj, 'reset').name('Reset Position');
        folder.open();
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

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));

        if (this.controls) {
            this.controls.update();
        }

        // --- 注ぐモーションのロジック ---
        if (this.testTubeGroup) {
            // 現在のZ軸回転角度を取得 (ラジアン)
            const rotationZ = Math.abs(this.testTubeGroup.rotation.z);
            // 75度
            const threshold = THREE.MathUtils.degToRad(75);

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

    /**
     * 画面遷移時などにリソースを解放する
     */
    dispose() {
        // GUIの削除
        if (this.gui) {
            this.gui.destroy();
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

        // 必要に応じてシーン内のオブジェクトもdisposeする
    }
}
