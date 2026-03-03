/**
 * ファイル名: frontend/src/scenes/LabScene.js
 * 概要: 実験の3Dシーン管理（Three.js）
 * 役割:
 *   - 3Dモデル（ビーカー、フラスコ、試験管など）の描画と物理挙動
 *   - 薬品の混合シミュレーションと視覚効果（パーティクル、色変化）
 *   - Joy-Conジャイロ操作の反映
 */
import { io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { determineType, ELEMENT_SPECIFIC_DATA, getValue, isTransparent, KEYS, parseColor } from '../data/chemicalMapping.js';

/**
 * 実験室の3Dシーンを管理するクラス
 */
export class LabScene {
    /**
     * @param {HTMLElement} container - Canvasを配置する親要素
     * @param {string} experimentId - 現在の実験ID（任意）
     */
    constructor(container, experimentId = null) {
        this.container = container;
        this.experimentId = experimentId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // 外部連携用 (UI側からのコールバック設定)
        this.onGyroData = null; // (data) => void
        this.isInputBlocked = false; // trueなら3D操作を停止
        this.testTubeGroup = null; // 試験管の操作用
        this.flaskGroup = null;    // フラスコの操作用
        this.liquidMaterial = null; // 液体マテリアル参照用
        this.animationId = null;
        this.resizeHandler = null;

        // 注ぐアニメーション用
        this.pouringParticles = [];
        this.isPouring = false;
        // 反応アニメーション用（泡など）
        this.reactionParticles = [];
        this.isReacting = false;
        this.reactionType = null; // 'oxygen', 'co2' etc.
        this.currentChemicalName = null; // 試験管の中身の名前
        this.flaskLiquidMesh = null; // フラスコ内の追加液体用
        this.mixingProgress = 0;     // 混ぜ具合
        this.lastFlaskZ = 0;         // フラスコ回転検知用

        this.socket = null; // Socket.io endpoint
        this.targetRotationZ = 0; // ラグ軽減のための目標角度
        this.flaskTargetRotationZ = 0; // フラスコ用目標角度

        // 化学反応の状態管理
        this.hasReactantAdded = false; // exp_09などのために追加: 反応試薬が投入されたか

        // キャリブレーション用
        this.testTubeOffset = 0;
        this.flaskOffset = 0;
        this.lastTestTubeRaw = 0;
        this.lastFlaskRaw = 0;
        this.angleHistory = []; // 平均化用バッファ
        this.flaskAngleHistory = []; // フラスコ用平均化用バッファ
        this.keyDownHandler = null;

        this.debugDisplay = null; // デバッグ表示用エレメント

        // デバッグ情報保持用
        this.debugInfo = {
            testTube: { raw: 0, adj: 0, final: 0 },
            flask: { raw: 0, adj: 0, final: 0 }
        };

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
        // ★位置調整: フラスコの口（X=0, Y=4.2付近）に合わせて注ぎやすい位置へ修正
        // 回転軸(Y=0)から口まで約4.0。90度傾けるとX方向に+4.0されるため、初期Xを-3.5付近に設定
        // 高さYは、傾けた時に口の上にくるように4.8程度にする
        this.testTubeGroup.position.set(-3.5, 4.8, 0);
        this.scene.add(this.testTubeGroup);

        // 8. フラスコを作成
        this.flaskGroup = this.createFlask();
        // ★位置調整: フラスコの位置を調整 (少し左に寄せて、試験管の真下近くにするなど)
        this.flaskGroup.position.set(0, 0, 0); // 中央よりに配置
        this.scene.add(this.flaskGroup);

        // ★フラスコの初期キャリブレーションフラグ
        // 初回受信時に現在の角度を0度として補正する
        this.isFlaskCalibrated = false;

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

        // コンテンツ格納用グループ
        this.testTubeContentGroup = new THREE.Group();
        group.add(this.testTubeContentGroup);

        // デフォルトで水のようなものを入れておく（または空）
        // this.updateTestTubeContent(this.testTubeContentGroup, "liquid", 0xccffff, true);

        return group;
    }

    // 試験管の中身を生成するメソッド (main.jsからの移植 + 調整)
    updateTestTubeContent(targetGroup, type, colorHex, isTrans) {
        targetGroup.clear(); // 既存の中身を消去

        const innerRadius = 0.45; // 試験管半径 0.5 より少し小さく

        // 座標系の調整: 試験管の底は y=-0.5
        const bottomY = -0.5;

        if (type === "liquid") {
            const liquidHeight = 2.5;
            const mat = new THREE.MeshPhysicalMaterial({
                color: colorHex,
                transmission: isTrans ? 0.9 : 0,
                opacity: isTrans ? 0.8 : 1.0,
                transparent: isTrans,
                roughness: 0.2,
                metalness: 0.1,
                side: THREE.DoubleSide
            });

            // 液面
            // 半径0.45, 高さ2.5
            const cylGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, liquidHeight, 32);
            // 試験管の底geometryは y=-0.5 付近。
            // 液体の底（球）を半径分だけ上にずらすので、筒の部分もそれに合わせて上げる。
            // 球の底が -0.5, 半径0.45なら、球の中心は -0.05
            // 筒の底は球の中心と同じ高さ(-0.05)から始まるべき
            // 筒の中心Y = 底Y(-0.05) + 高さ/2
            cylGeo.translate(0, (bottomY + innerRadius) + liquidHeight/2, 0);

            const mesh = new THREE.Mesh(cylGeo, mat);
            targetGroup.add(mesh);

            // 液体の底（球）
            // 試験管のgeometryの底はy=-0.5。ガラス厚を考え少し浮かす
            const sphereGeo = new THREE.SphereGeometry(innerRadius, 32, 16, 0, Math.PI*2, 0, Math.PI/2);
            sphereGeo.rotateX(Math.PI); // 下向き

            // 球の中心座標 = (底の座標 + 半径)
            // 試験管の底(-0.5)にピッタリ合わせるとガラスを突き抜けることがあるので、-0.5 + 半径
            sphereGeo.translate(0, bottomY + innerRadius, 0);
            const sphereMesh = new THREE.Mesh(sphereGeo, mat);
            targetGroup.add(sphereMesh);

        } else if (type === "metal_ingot") {
            const mat = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 0.4,
                metalness: 0.6 // 真っ黒にならないように少し下げる
            });

            for(let i=0; i<5; i++) { // 数を増やす
                    const w = 0.2 + Math.random()*0.15;
                    const h = 0.4 + Math.random()*0.2;
                    const d = 0.15 + Math.random()*0.1;
                    const box = new THREE.BoxGeometry(w, h, d);
                    const mesh = new THREE.Mesh(box, mat);
                    // 底付近にランダム配置
                    mesh.position.set(
                        (Math.random()-0.5)*0.4,
                        bottomY + h/2 + (Math.random()*0.3),
                        (Math.random()-0.5)*0.4
                    );
                    mesh.rotation.set( Math.random(), Math.random(), Math.random() );
                    targetGroup.add(mesh);
            }
        } else if (type === "solid_powder") {
            const mat = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 1.0,
                metalness: 0.0
            });

            // 山盛り
            const pileHeight = 0.8;
            const coneGeo = new THREE.ConeGeometry(innerRadius*0.9, pileHeight, 32);
            // 底を合わせる
            coneGeo.translate(0, bottomY + pileHeight/2, 0);
            const mesh = new THREE.Mesh(coneGeo, mat);
            targetGroup.add(mesh);

        } else if (type === "solid_crystal") {
            const mat = new THREE.MeshPhysicalMaterial({
                color: colorHex,
                transmission: 0.6,
                opacity: 0.9,
                transparent: true,
                roughness: 0.1,
                metalness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });

            for(let i=0; i<15; i++) {
                const s = 0.12 + Math.random()*0.08;
                const geo = new THREE.OctahedronGeometry(s, 0);
                const mesh = new THREE.Mesh(geo, mat);

                // 積み上げるような配置は難しいのでランダムに散らす
                // Y座標は底から少し上
                const y = bottomY + s + (Math.random() * 0.8);
                const r = (innerRadius - s) * Math.sqrt(Math.random());
                const theta = Math.random() * Math.PI * 2;

                mesh.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
                mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);

                targetGroup.add(mesh);
            }

        } else if (type === "solid_pellet") {
            const mat = new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: 0.5,
                metalness: 0.0
            });

            for(let i=0; i<20; i++) {
                const rad = 0.1; // 少し小さく
                const geo = new THREE.SphereGeometry(rad, 16, 16);
                const mesh = new THREE.Mesh(geo, mat);

                const y = bottomY + rad + (Math.random() * 0.8);
                const r = (innerRadius - rad) * Math.sqrt(Math.random());
                const theta = Math.random() * Math.PI * 2;

                mesh.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
                targetGroup.add(mesh);
            }
        } else if (type === "gas") {
            if (colorHex) {
                 const gasHeight = 4.0;
                 const mat = new THREE.MeshBasicMaterial({
                    color: colorHex,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide,
                    depthWrite: false
                 });
                 const cylGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, gasHeight, 32);
                 cylGeo.translate(0, bottomY + gasHeight/2, 0);
                 const mesh = new THREE.Mesh(cylGeo, mat);
                 targetGroup.add(mesh);
            }
        }
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
            side: THREE.DoubleSide,
            depthWrite: false // ★追加: 中身を透過させるためにガラスの深度書き込みを無効化
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

        // EXPERIMENT_SPECIFIC_CONTENT
        if (this.experimentId === 'exp_01_o2') {
            // 酸素発生実験: 二酸化マンガン（黒い粉末）- パーティクルで表現
            const particleCount = 3000;
            const geo = new THREE.BufferGeometry();
            const positions = [];

            // 円錐状にランダムに配置
            const R = 1.3; // 底面半径
            const H = 0.8; // 高さ

            for (let i = 0; i < particleCount; i++) {
                const y = Math.random() * H;
                // 高さに対する最大半径 (上に行くほど狭く)
                const maxR = R * (1 - (y/H));
                // 均等分布のためのr計算
                const r = maxR * Math.sqrt(Math.random());
                const theta = Math.random() * Math.PI * 2;

                const x = r * Math.cos(theta);
                const z = r * Math.sin(theta);

                positions.push(x, y, z);
            }

            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const mat = new THREE.PointsMaterial({
                color: 0x000000, // 完全な黒
                size: 0.08,
                sizeAttenuation: true,
                transparent: true, // フェードアウトのためにtrueに戻す
                opacity: 1.0,
                depthTest: true,
                depthWrite: false // ★修正: パーティクル自体の深度書き込みは無効化
            });

            this.manganeseOxideParticles = new THREE.Points(geo, mat);
            // フラスコ底の厚みを考慮して配置
            this.manganeseOxideParticles.position.y = 0.1;
            this.manganeseOxideParticles.renderOrder = 1; // ガラスより後に描画して確実に見えるようにする

            // ★重要: ガラスよりも後（または内側）に描画されるようにrenderOrderを調整
            // ただしPointsは通常透明扱い(transparent:trueの場合)なので、最後に描画されることが多い
            // 今回はtransparent:falseにしたので不透明パスで描画される。
            // ガラス(transparent:true)の中に不透明物体がある構成なら、通常は正しく見えるはず。

            group.add(this.manganeseOxideParticles);

            // フラスコ内に注がれる液体（最初は非表示）
            // フラスコの形状に合わせて円錐台形のジオメトリを作成
            // 底半径: 1.4, 上面半径: 0.6, 高さ: 2.5 (胴体部分)
            // 原点(底)基準にするため、y方向に高さ/2だけずらす
            const liquidHeight = 2.5;
            const addedLiquidGeo = new THREE.CylinderGeometry(0.6, 1.4, liquidHeight, 32);
            addedLiquidGeo.translate(0, liquidHeight/2, 0);

            const addedLiquidMat = new THREE.MeshPhysicalMaterial({
                color: 0xaaccff, // 無色透明っぽい水色
                transparent: true,
                opacity: 0.5,
                transmission: 0.9,
                roughness: 0.1,
                depthWrite: false // ★追加: 液体も深度書き込みを無効化
            });

            this.flaskLiquidMesh = new THREE.Mesh(addedLiquidGeo, addedLiquidMat);
            this.flaskLiquidMesh.visible = false;
            // 初期状態は非常に薄く (高さほぼ0)
            this.flaskLiquidMesh.scale.y = 0.01;
            this.flaskLiquidMesh.position.y = 0.1; // 粉の上に被さるように
            this.flaskLiquidMesh.renderOrder = 2; // 粉よりさらに後に描画

            group.add(this.flaskLiquidMesh);

        } else if (this.experimentId === 'exp_02_co2') {
            // 二酸化炭素発生実験: 石灰石（白色の塊）
            this.limestoneGroup = new THREE.Group();

            const mat = new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                roughness: 0.9,
                metalness: 0.1
            });

            // 石灰石の塊を配置
            for(let i=0; i<15; i++) {
                const s = 0.15 + Math.random()*0.1;
                const geo = new THREE.DodecahedronGeometry(s, 0);
                const mesh = new THREE.Mesh(geo, mat);

                // フラスコの底に配置 (半径1.0以内)
                const r = Math.random() * 1.0;
                const theta = Math.random() * Math.PI * 2;

                mesh.position.set(
                    r * Math.cos(theta),
                    0.2 + Math.random()*0.3, // 底から少し浮かす
                    r * Math.sin(theta)
                );
                mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                this.limestoneGroup.add(mesh);
            }
            this.limestoneGroup.renderOrder = 1;
            group.add(this.limestoneGroup);

            // 注がれる液体 (塩酸)
            const liquidHeight = 2.5;
            const addedLiquidGeo = new THREE.CylinderGeometry(0.6, 1.4, liquidHeight, 32);
            addedLiquidGeo.translate(0, liquidHeight/2, 0);

            const addedLiquidMat = new THREE.MeshPhysicalMaterial({
                color: 0xddeeff, // 無色透明に近いがわずかに青み
                transparent: true,
                opacity: 0.5,
                transmission: 0.9,
                roughness: 0.1,
                depthWrite: false
            });

            this.flaskLiquidMesh = new THREE.Mesh(addedLiquidGeo, addedLiquidMat);
            this.flaskLiquidMesh.visible = false;
            this.flaskLiquidMesh.scale.y = 0.01;
            this.flaskLiquidMesh.position.y = 0.1;
            this.flaskLiquidMesh.renderOrder = 2;

            group.add(this.flaskLiquidMesh);

        } else if (this.experimentId === 'exp_03_al') {
            // アルミニウム（薄い銀色の板や破片）
            this.aluminumGroup = new THREE.Group();

            const mat = new THREE.MeshStandardMaterial({
                color: 0xcccccc, // 銀色
                roughness: 0.3,
                metalness: 0.8,
                side: THREE.DoubleSide
            });

            // アルミ片を配置
            for(let i=0; i<20; i++) {
                // 薄い板状
                const geo = new THREE.BoxGeometry(0.2, 0.01, 0.2);
                const mesh = new THREE.Mesh(geo, mat);

                // フラスコの底に配置
                const r = Math.random() * 1.0;
                const theta = Math.random() * Math.PI * 2;

                mesh.position.set(
                    r * Math.cos(theta),
                    0.05 + Math.random()*0.1,
                    r * Math.sin(theta)
                );
                // ランダムに回転させて散らばっている感を出す
                mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                this.aluminumGroup.add(mesh);
            }
            this.aluminumGroup.renderOrder = 1;
            group.add(this.aluminumGroup);

            // 注がれる液体 (塩酸)
            const liquidHeight = 2.5;
            const addedLiquidGeo = new THREE.CylinderGeometry(0.6, 1.4, liquidHeight, 32);
            addedLiquidGeo.translate(0, liquidHeight/2, 0);

            const addedLiquidMat = new THREE.MeshPhysicalMaterial({
                color: 0xddeeff, // 無色透明
                transparent: true,
                opacity: 0.5,
                transmission: 0.9,
                roughness: 0.1,
                depthWrite: false
            });

            this.flaskLiquidMesh = new THREE.Mesh(addedLiquidGeo, addedLiquidMat);
            this.flaskLiquidMesh.visible = false;
            this.flaskLiquidMesh.scale.y = 0.01;
            this.flaskLiquidMesh.position.y = 0.1;
            this.flaskLiquidMesh.renderOrder = 2;

            group.add(this.flaskLiquidMesh);

        } else if (this.experimentId === 'exp_09_ag') {
            // 硝酸銀水溶液の反応 (AgNO3 + NaCl -> AgCl↓ + NaNO3)
            // フラスコには最初「硝酸銀水溶液」（無色透明）が入っている設定にするのが自然だが、
            // 今までのロジック（注ぐのは液体）と合わせるなら、
            // フラスコにあらかじめ「硝酸銀水溶液」が入っていて、そこに「食塩水」を注ぐ形にする。

            // 液体（硝酸銀水溶液）初期状態
            const liquidHeight = 1.0; // 最初からある程度入っている
            const liquidGeo = new THREE.CylinderGeometry(1.2, 1.4, liquidHeight, 32);
            liquidGeo.translate(0, liquidHeight/2, 0);

            const liquidMat = new THREE.MeshPhysicalMaterial({
                color: 0xddeeff, // 無色透明
                transparent: true,
                opacity: 0.3,
                transmission: 0.95,
                roughness: 0.05,
                depthWrite: false
            });

            this.flaskLiquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
            this.flaskLiquidMesh.visible = true; // 最初から見える
            this.flaskLiquidMesh.scale.y = 0.5;  // 最初は硝酸銀のみで半分の量
            this.flaskLiquidMesh.position.y = 0.1;
            this.flaskLiquidMesh.renderOrder = 2;
            group.add(this.flaskLiquidMesh);

            // 沈殿物（塩化銀）用のパーティクルグループ
            this.precipitateGroup = new THREE.Group();
            this.precipitateGroup.visible = false; // 最初は見えない

            // 白い粉っぽいパーティクルを大量に用意
            const pGeo = new THREE.BufferGeometry();
            const pCount = 500;
            const positions = new Float32Array(pCount * 3);

            for(let i=0; i<pCount; i++) {
                // フラスコ内部にランダム配置
                const r = Math.random() * 1.0;
                const theta = Math.random() * Math.PI * 2;
                const y = Math.random() * 2.5; // 液中全体に広がる

                positions[i*3] = r * Math.cos(theta);
                positions[i*3+1] = y;
                positions[i*3+2] = r * Math.sin(theta);
            }
            pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const pMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.05,
                transparent: true,
                opacity: 0.8
            });

            this.precipitateParticles = new THREE.Points(pGeo, pMat);
            this.precipitateGroup.add(this.precipitateParticles);
            group.add(this.precipitateGroup);


        } else {
            // デフォルト: フラスコの中身（液体：赤色）
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
        }

        return group;
    }

    // 化学物質を設定するメソッド
    setChemical(chemicalData) {
        if (!this.testTubeContentGroup || !chemicalData) return;

        const name = (getValue(chemicalData, KEYS.NAME) || "").trim();
        const appText = getValue(chemicalData, KEYS.APP) || "";
        console.log(`Setting chemical: ${name} (${appText})`);

        // ★修正: 現在の物質名を保存
        this.currentChemicalName = name;
        this.testTubeLiquidAmount = 1.0; // 追加: 初期残量100%

        // タイプ決定
        const type = determineType(chemicalData);


        // 色決定
        let colorHex = null;
        if (ELEMENT_SPECIFIC_DATA[name] && ELEMENT_SPECIFIC_DATA[name].color !== null) {
            colorHex = ELEMENT_SPECIFIC_DATA[name].color;
        } else {
            colorHex = parseColor(appText);
        }

        const isTrans = isTransparent(appText);

        console.log(`Determined Type: ${type}, Color: ${colorHex ? colorHex.toString(16) : 'null'}`);

        // コンテンツ更新
        this.updateTestTubeContent(this.testTubeContentGroup, type, colorHex, isTrans);
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
            this.testTubeOffset = this.lastTestTubeRaw;
            this.flaskOffset = this.lastFlaskRaw;
            console.log(`[LabScene] Calibrated! TestTube: ${this.testTubeOffset}, Flask: ${this.flaskOffset}`);
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
            if (Math.abs(this.targetRotationZ - this.testTubeGroup.rotation.z) > 0.001) {
                this.testTubeGroup.rotation.z += (this.targetRotationZ - this.testTubeGroup.rotation.z) * 0.1;
            }
        }

        // --- フラスコの角度を滑らかに更新 (Lerp) ---
        if (this.flaskGroup) {
            // 現在の角度から目標角度へ少しずつ近づける (.rotation.z を使うと仮定)
            const target = this.flaskTargetRotationZ || 0;
            if (Math.abs(target - this.flaskGroup.rotation.z) > 0.001) {
                this.flaskGroup.rotation.z += (target - this.flaskGroup.rotation.z) * 0.1;
            }
        }

        // --- 注ぐモーションのロジック ---
        if (this.testTubeGroup) {
            // 現在のZ軸回転角度を取得
            const currentRotationZ = this.testTubeGroup.rotation.z;

            // 閾値: 60度以上傾けると出るように変更 (ユーザー要望)
            const threshold = THREE.MathUtils.degToRad(60);

            // フラスコが安定している(直立している)かチェック
            let isFlaskStable = true;
            if (this.flaskGroup) {
                // フラスコの傾きが10度未満なら安定とみなす
                if (Math.abs(this.flaskGroup.rotation.z) > THREE.MathUtils.degToRad(10)) {
                    isFlaskStable = false;
                }
            }

            // 試験管は左側(-3.5)にあるため、右側(フラスコ方向)に傾けた時のみ注ぐ
            // 右回転は負の値になる (時計回り)
            // つまり、角度が -60度 以下（例: -90度）の場合に注ぐ
            const isTiltingRight = currentRotationZ <= -threshold;

            if (isTiltingRight && isFlaskStable) {
                // 注いでいる状態
                if (!this.isPouring) {
                    this.isPouring = true;
                    // 注ぎ始めの処理があればここに
                }

                // パーティクル生成頻度調整
                if (Math.random() > 0.5) {
                    this.spawnPourParticle();
                }

                // --- 試験管の中身を減らす処理 ---
                if (this.currentChemicalName && this.testTubeContentGroup) {
                    // 残量を減らす (約3～4秒で空になるペース)
                    this.testTubeLiquidAmount -= 0.005;
                    if (this.testTubeLiquidAmount < 0) this.testTubeLiquidAmount = 0;

                    // 液体メッシュの高さを更新
                    // updateTestTubeContentで生成されるのは [0]:Cylinder(液柱), [1]:Sphere(底)
                    // 液柱のスケールをY軸方向に縮小する
                    const liquidCyl = this.testTubeContentGroup.children[0];
                    if (liquidCyl) {
                        liquidCyl.scale.y = this.testTubeLiquidAmount;
                        liquidCyl.visible = this.testTubeLiquidAmount > 0.05; // ほぼなくなったら非表示
                    }
                    const liquidSphere = this.testTubeContentGroup.children[1];
                    if (liquidSphere) {
                        liquidSphere.visible = this.testTubeLiquidAmount > 0.05;
                    }

                    // 空になったら名前をクリア（これ以上注げないようにする）
                    if (this.testTubeLiquidAmount <= 0) {
                        this.currentChemicalName = null;
                        this.testTubeContentGroup.clear(); // 完全に消す
                    }
                }


                // フラスコ内の液面を上昇させる (許可された物質の場合のみ)
                const isExp01 = (this.experimentId === 'exp_01_o2');
                const isExp02 = (this.experimentId === 'exp_02_co2');
                const isExp03 = (this.experimentId === 'exp_03_al');
                const isExp09 = (this.experimentId === 'exp_09_ag');

                if (this.currentChemicalName && (isExp01 || isExp02 || isExp03 || isExp09) && this.flaskLiquidMesh) {
                     // 簡易名称チェック
                    let isTargetChemical = false;

                    if (isExp01 && (
                        this.currentChemicalName.includes('過酸化水素') ||
                        this.currentChemicalName === '酸素' ||
                        this.currentChemicalName === '水素'
                    )) {
                        isTargetChemical = true;
                    }

                    if ((isExp02 || isExp03) && (
                        this.currentChemicalName.includes('塩酸') ||
                        this.currentChemicalName === '塩化水素' ||
                        this.currentChemicalName === 'HCl' ||
                        this.currentChemicalName === 'HCL'
                    )) {
                        isTargetChemical = true;
                    }

                    if (isExp09 && (
                        this.currentChemicalName.includes('食塩') ||
                        this.currentChemicalName.includes('NaCl') ||
                        this.currentChemicalName === '塩化ナトリウム'
                    )) {
                        isTargetChemical = true;
                    }

                    if (isTargetChemical) {
                        this.flaskLiquidMesh.visible = true;
                        // 徐々にスケールアップ (初期高さ2.5 * scale.y)
                        // scale.y = 1.0 でフラスコの肩口あたり
                        if (this.flaskLiquidMesh.scale.y < 1.0) {
                            this.flaskLiquidMesh.scale.y += 0.005;
                            // exp_09なら試薬投入フラグをON
                            if (isExp09) this.hasReactantAdded = true;
                        }
                    }
                }
            } else {
                this.isPouring = false;
            }

        // --- 混合・反応ロジック (常時実行: 注いでいない時でも振れば混ざる) ---
        // exp_01_o2, exp_02_co2, exp_03_al, exp_09_ag で有効
        const activeExpId = ['exp_01_o2', 'exp_02_co2', 'exp_03_al', 'exp_09_ag'].includes(this.experimentId) ? this.experimentId : null;

        if (activeExpId && this.flaskLiquidMesh && this.flaskLiquidMesh.visible) {


            // 1. 混ぜる動作の検知 (フラスコを振って混ぜる)
            // フラスコがある程度入っている状態で、フラスコが動かされたら累積角度を加算

            // ★追加: exp_09_ag の場合は「食塩水が注がれていない」と反応を進めないようにする
            let canMix = true;
            if (activeExpId === 'exp_09_ag' && !this.hasReactantAdded) {
                canMix = false;
            }

            if (this.flaskLiquidMesh.scale.y > 0.2 && canMix) {
                const currentFlaskZ = this.flaskGroup ? this.flaskGroup.rotation.z : 0;
                // 前フレームとの差分（絶対値）ラジアン
                const deltaRad = Math.abs(currentFlaskZ - (this.lastFlaskZ || 0));
                this.lastFlaskZ = currentFlaskZ;

                // 微小なブレ（ノイズ）は無視
                if (deltaRad > 0.001) {
                    // ラジアン -> 度数変換して加算
                    // 絶対値なのでマイナス関係なし。総移動量を積算。
                    const deltaDeg = THREE.MathUtils.radToDeg(deltaRad);
                    this.mixingProgress += deltaDeg;
                }
            }

            // 2. 混合によるビジュアル変化
            // ★混合演出: 色を変化させる (薄い水色 -> 黒っぽい灰色へ)
            if (this.flaskLiquidMesh.material && this.flaskLiquidMesh.material.color) {
                if (this.mixingProgress > 0) {
                    const currentColor = this.flaskLiquidMesh.material.color;

                    // 実験によって色変化ターゲットを変える
                    let targetColorHex = 0x222222; // デフォルト黒
                    if (activeExpId === 'exp_02_co2') {
                         targetColorHex = 0xffffff; // 白濁
                    } else if (activeExpId === 'exp_03_al') {
                         targetColorHex = 0xaaaaaa; // アルミが溶けると灰色
                    } else if (activeExpId === 'exp_09_ag') {
                         // 硝酸銀(透明) + 食塩水(透明) -> 塩化銀(白濁)
                         // 液体自体は白っぽくなり、沈殿物も出る
                         targetColorHex = 0xeeeeee;
                    }

                    // Lerpで徐々に目標色へ
                    // 沈殿実験の場合は、反応が進むと白濁するため不透明度も上げる
                    if (activeExpId === 'exp_09_ag') {
                        // 試薬が入っている場合のみ色変化
                        if (this.hasReactantAdded) {
                            currentColor.lerp(new THREE.Color(targetColorHex), 0.05);
                            if (this.flaskLiquidMesh.material.opacity < 0.7) {
                                this.flaskLiquidMesh.material.opacity += 0.01;
                            }
                        }
                    } else {
                         currentColor.lerp(new THREE.Color(targetColorHex), 0.05);

                        // 不透明度も上げて「混ざってる感」を出す
                        if (this.flaskLiquidMesh.material.opacity < 0.95) {
                            this.flaskLiquidMesh.material.opacity += 0.005;
                        }
                    }
                }
            }

            // ★二酸化マンガン（粉末）の消去演出 (O2実験のみ)

            if (activeExpId === 'exp_01_o2' && this.manganeseOxideParticles && this.manganeseOxideParticles.material) {
                // 液面がある程度上がったら
                if (this.flaskLiquidMesh.scale.y > 0.1) {
                    // 拡散（Y方向に少し広がる）
                    const targetScale = this.flaskLiquidMesh.scale.y * 2.0;
                    if (targetScale > 0.1 && this.manganeseOxideParticles.scale.y < targetScale) {
                        this.manganeseOxideParticles.scale.y += 0.01;
                        this.manganeseOxideParticles.position.y += 0.005;
                    }

                    // 1. 液量による不透明度低下 (Max 0.4まで下がる)
                    let opacityFromPouring = 1.0;
                    if (this.flaskLiquidMesh.scale.y > 0.2) {
                        const ratio = Math.min(1.0, (this.flaskLiquidMesh.scale.y - 0.2) / 0.8);
                        opacityFromPouring = 1.0 - (ratio * 0.6);
                    }

                    // 2. 混ぜ進捗による不透明度低下 (Max 0.0まで下がる)
                    let opacityFromMixing = 1.0;
                    const TARGET_DEGREE = 300.0;

                    if (this.mixingProgress > 0) {
                        const ratio = Math.min(1.0, this.mixingProgress / TARGET_DEGREE);
                        opacityFromMixing = 1.0 - ratio;
                    }

                    // 両方の効果を掛け合わせる
                    const targetOpacity = Math.min(opacityFromPouring, opacityFromMixing);

                    if (this.manganeseOxideParticles.material.opacity > targetOpacity) {
                        this.manganeseOxideParticles.material.opacity -= 0.01;
                    }

                    if (this.manganeseOxideParticles.material.opacity <= 0.01) {
                        this.manganeseOxideParticles.material.opacity = 0;
                        this.manganeseOxideParticles.visible = false;
                    }
                }
            }

            // ★石灰石（CO2実験）の消去演出
            if (activeExpId === 'exp_02_co2' && this.limestoneGroup) {
                 if (this.flaskLiquidMesh.scale.y > 0.2 && this.mixingProgress > 100) {
                     // 混ぜると溶けていく
                     this.limestoneGroup.children.forEach(mesh => {
                         if (mesh.scale.x > 0.01) {
                             mesh.scale.multiplyScalar(0.99); // 徐々に小さく
                         } else {
                             mesh.visible = false;
                         }
                     });
                 }
            }

            // ★アルミニウム（Al実験）の消去演出
            if (activeExpId === 'exp_03_al' && this.aluminumGroup) {
                 if (this.flaskLiquidMesh.scale.y > 0.2 && this.mixingProgress > 30.0) {
                     // 混ぜ進捗に合わせて徐々に溶かす (30～280の間で 1.0 -> 0.0)
                     const duration = 250.0;
                     const progress = Math.min(1.0, (this.mixingProgress - 30.0) / duration);
                     const targetScale = 1.0 - progress;

                     this.aluminumGroup.children.forEach(mesh => {
                         if (mesh.visible) {
                             // スケール更新（混ぜ具合と連動）
                             mesh.scale.setScalar(Math.max(0.001, targetScale));

                             // 振動・沸騰演出
                             // ランダムウォークによるドリフトを防ぐため、元のY位置（の近似値）に戻りつつ振動させる等の工夫が良いが
                             // 短時間の演出なので簡易的に
                             mesh.position.y += (Math.random() - 0.5) * 0.01;
                             mesh.rotation.x += 0.1;
                             mesh.rotation.z += 0.1;

                             // 完全に溶けたら消す
                             if (targetScale <= 0.01) {
                                 mesh.visible = false;
                             }
                         }
                     });
                 }
            }

            // ★塩化銀（AgCl）の沈殿演出
            if (activeExpId === 'exp_09_ag' && this.precipitateParticles && this.flaskLiquidMesh.scale.y > 0.1) {
                // 注いで混ぜると発生 (試薬投入済みが条件)
                if (this.mixingProgress > 30 && this.hasReactantAdded) {
                    this.precipitateGroup.visible = true;
                    // 徐々に濃くなる
                    if (this.precipitateParticles.material.opacity < 0.8) {
                        this.precipitateParticles.material.opacity += 0.02;
                    }

                    // ゆっくり沈降させる
                    const positions = this.precipitateParticles.geometry.attributes.position.array;
                    let needUpdate = false;

                    // 単純に下に動かすと床を突き抜けるので、ある程度下に溜まっていく演出
                    for(let i=0; i < positions.length / 3; i++) {
                        const idx = i * 3;
                        let y = positions[idx+1];

                        if (y > 0.1) {
                             // まだ浮遊している場合、少しずつ沈む
                             y -= 0.005 + Math.random() * 0.005;
                             positions[idx+1] = y;
                             needUpdate = true;
                        } else {
                             // 底に溜まったら少し広げる
                             // positions[idx] += (Math.random()-0.5)*0.001;
                        }
                    }

                    if (needUpdate) {
                        this.precipitateParticles.geometry.attributes.position.needsUpdate = true;
                    }
                }
            } else {
                // 3. 反応開始 (少し混ぜたら(30度分くらい)泡が出始める)
                if (!this.isReacting && this.mixingProgress > 30.0) {
                    this.isReacting = true;
                }

                // 振っているときに泡を出す演出を追加 (O2, CO2, Alのみ)
                if (this.isReacting && this.flaskLiquidMesh.scale.y > 0.2) {
                     if (Math.random() > 0.9) {
                        const bubblePos = new THREE.Vector3(0, 0, 0);
                        this.spawnReactionBubble(bubblePos);
                     }
                }
            }

            // 4. 完了判定
            if (this.mixingProgress >= 300.0 && !this.isCompleted) {
                this.isCompleted = true;
                if (this.onExperimentComplete) {
                    this.onExperimentComplete(activeExpId);
                }
            }
        }
        }

        this.updateParticles();
        this.updateReactionParticles(); // 反応エフェクト更新

        // デバッグ表示更新
        if (this.debugDisplay && this.debugInfo) {
             const tData = this.debugInfo.testTube;
             const fData = this.debugInfo.flask;
             // 混ぜ進捗を表示: this.mixingProgress (0 ~ 300)
             this.debugDisplay.innerHTML = `
                 <div style="margin-bottom:5px; border-bottom:1px solid #555;"><strong>TestTube (JoyCon L)</strong><br>
                 Raw: ${tData.raw.toFixed(1)}° / Adj: ${tData.adj.toFixed(1)}°<br>
                 Final: <span style="color:cyan">${tData.final.toFixed(1)}°</span></div>

                 <div style="margin-bottom:5px; border-bottom:1px solid #555;"><strong>Flask (JoyCon R)</strong><br>
                 Raw: ${fData.raw.toFixed(1)}° / Adj: ${fData.adj.toFixed(1)}°<br>
                 Final: <span style="color:cyan">${fData.final.toFixed(1)}°</span></div>

                 <div style="color: yellow;"><strong>Quest Mixing</strong><br>
                 Progress: ${this.mixingProgress.toFixed(1)} / 300.0</div>
             `;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    startReaction(type) {
        if (this.isReacting) return;
        this.isReacting = true;
        this.reactionType = type;
        console.log(`Reaction started: ${type}`);
    }

    spawnPourParticle() {
        if (!this.testTubeGroup) return;
        // ★修正: 試験管の中身がセットされていない場合は注がない
        if (!this.currentChemicalName) return;

        // 試験管の口の位置を計算 (ローカル座標 (0, 4.0, 0) 付近)
        // 少しばらつきを持たせる
        const tipLocal = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            4.0,
            (Math.random() - 0.5) * 0.2
        );
        tipLocal.applyMatrix4(this.testTubeGroup.matrixWorld);

        // パーティクル生成
        // 色は試験管の中身に合わせたいが、一旦薄い水色で固定
        const pGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xaaccff, transparent: true, opacity: 0.8 });
        const pMesh = new THREE.Mesh(pGeo, pMat);

        pMesh.position.copy(tipLocal);

        // 速度ベクトル: 重力に従って落ちるが、少し試験管の傾き方向に出る勢いも
        // 簡易的に真下に落とす
        pMesh.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                -0.15 - Math.random() * 0.1,
                (Math.random() - 0.5) * 0.05
            ),
            life: 60
        };

        this.scene.add(pMesh);
        this.pouringParticles.push(pMesh);
    }

    updateParticles() {
        for (let i = this.pouringParticles.length - 1; i >= 0; i--) {
            const p = this.pouringParticles[i];

            if (!p || !p.userData) continue;

            p.position.add(p.userData.velocity);

            // 簡易物理: フラスコの口(Y=4.0付近)に入ったら消える判定など
            // ここではY<1.0 (フラスコ底付近) まで落ちたら消して、反応エフェクトに繋げる
            if (p.position.y < 1.0) {
                // 接地（液面到達）
                this.scene.remove(p);
                this.pouringParticles.splice(i, 1);

                // ここで反応パーティクル発生のチャンス
                if (this.isReacting) {
                   this.spawnReactionBubble(p.position);
                }

                // メモリ解放
                p.geometry.dispose();
                p.material.dispose();
            } else if (p.userData.life-- <= 0) {
                this.scene.remove(p);
                this.pouringParticles.splice(i, 1);
                p.geometry.dispose();
                p.material.dispose();
            }
        }
    }

    // 反応（泡）の発生
    spawnReactionBubble(pos) {
        // フラスコ内の液面付近から泡が出る
        const bubbleGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8);
        const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);

        // 発生位置: 注がれた地点(pos)を中心に少し散らす
        bubble.position.set(
            pos.x + (Math.random() - 0.5) * 1.0,
            1.0 + Math.random() * 0.5, // 液面付近
            pos.z + (Math.random() - 0.5) * 1.0
        );

        bubble.userData = {
            velY: 0.05 + Math.random() * 0.05, // 上昇速度
            life: 100 + Math.random() * 50
        };

        this.scene.add(bubble);
        this.reactionParticles.push(bubble);
    }

    updateReactionParticles() {
        for (let i = this.reactionParticles.length - 1; i >= 0; i--) {
            const b = this.reactionParticles[i];

            b.position.y += b.userData.velY;
            // 左右にゆらゆら
            b.position.x += Math.sin(Date.now() * 0.01 + b.id) * 0.01;

            b.userData.life--;

            // ある程度上昇したら消える
            if (b.userData.life <= 0 || b.position.y > 5.0) {
                this.scene.remove(b);
                this.reactionParticles.splice(i, 1);
                b.geometry.dispose();
                b.material.dispose();
            }
        }
    }

    setupSocketConnection() {
        // バックエンドに接続
        this.socket = io('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log('Connected to backend socket');
        });

        // ESP32からのジャイロデータを受信
        this.socket.on('gyro-data', (data) => {
            // LabView側で周期表操作などでデータを使いたい場合があるため、生データをコールバック
            if (this.onGyroData) {
                this.onGyroData(data); // dataには raw: { buttons, sticks, ... } が含まれている
            }

            // もし周期表が開いていたら、3D操作は停止させる
            if (this.isInputBlocked) return;

            // console.log('Received gyro data:', data); // Debug Log -> コメントアウトしてログ削減

            // data.angle は -180 ~ 180 程度の値が入ると想定
            // 数値変換を確実に行う
            let angleVal = parseFloat(data.angle);
            const targetDevice = data.target || 'test_tube'; // デフォルトは試験管

            // groupが生成される前にデータが来ることがあるのでチェック
            if (!isNaN(angleVal)) {
                 // 角度の正規化: 0~360度で来る場合も考慮して -180 ~ 180 に収める
                // これにより「右に傾けると350度になってしまい、反対側に回ろうとする」等を防ぐ
                while (angleVal > 180) angleVal -= 360;
                while (angleVal <= -180) angleVal += 360;

                let adjustedAngle = 0;
                let finalAngle = 0;

                if (targetDevice === 'test_tube' && this.testTubeGroup) {
                    this.lastTestTubeRaw = angleVal;
                    adjustedAngle = angleVal - this.testTubeOffset;
                    // Normalize
                    while (adjustedAngle > 180) adjustedAngle -= 360;
                    while (adjustedAngle <= -180) adjustedAngle += 360;

                    // --- 試験管用移動平均フィルタ ---
                    this.angleHistory.push(adjustedAngle);
                    if (this.angleHistory.length > 5) {
                        this.angleHistory.shift();
                    }
                    // 平均値を計算
                    let averageAngle = this.angleHistory.reduce((sum, val) => sum + val, 0) / this.angleHistory.length;

                     // 強力なデッドバンド: 直立付近(±5度)は完全に0にする
                    if (Math.abs(averageAngle) < 5.0) {
                        averageAngle = 0;
                    }

                    // 角度制限: -120 ~ 120
                    finalAngle = THREE.MathUtils.clamp(averageAngle, -120, 120);

                    // 目標角度を更新 (Degree -> Radian)
                    this.targetRotationZ = THREE.MathUtils.degToRad(finalAngle);

                    // デバッグ情報更新
                    if (this.debugInfo) {
                        this.debugInfo.testTube = {
                            raw: angleVal,
                            adj: adjustedAngle,
                            final: finalAngle
                        };
                    }

                } else if (targetDevice === 'flask' && this.flaskGroup) {
                    this.lastFlaskRaw = angleVal;

                    // 自動キャリブレーション（初回のみ）
                    if (!this.isFlaskCalibrated) {
                        this.flaskOffset = angleVal;
                        this.isFlaskCalibrated = true;
                        console.log(`[LabScene] Auto-calibrated Flask! Offset: ${this.flaskOffset}`);
                    }

                    adjustedAngle = angleVal - this.flaskOffset;
                    // Normalize
                    while (adjustedAngle > 180) adjustedAngle -= 360;
                    while (adjustedAngle <= -180) adjustedAngle += 360;

                     // --- フラスコ用移動平均フィルタ ---
                    if (!this.flaskAngleHistory) this.flaskAngleHistory = [];
                    this.flaskAngleHistory.push(adjustedAngle);
                    if (this.flaskAngleHistory.length > 5) {
                        this.flaskAngleHistory.shift();
                    }
                    // 平均値を計算
                    let averageAngle = this.flaskAngleHistory.reduce((sum, val) => sum + val, 0) / this.flaskAngleHistory.length;

                     // 強力なデッドバンド: 直立付近(±5度)は完全に0にする
                    if (Math.abs(averageAngle) < 5.0) {
                        averageAngle = 0;
                    }

                    // 角度制限: -120 ~ 120
                    finalAngle = THREE.MathUtils.clamp(averageAngle, -120, 120);

                    // 目標角度を更新
                    this.flaskTargetRotationZ = THREE.MathUtils.degToRad(finalAngle);

                    // デバッグ情報更新
                    if (this.debugInfo) {
                        this.debugInfo.flask = {
                            raw: angleVal,
                            adj: adjustedAngle,
                            final: finalAngle
                        };
                    }
                }

                // デバッグ表示更新はanimateループで行うためここではデータ更新のみ


            } else {
                // console.warn('Gyro update skipped:', { group: !!this.testTubeGroup, angle: data.angle });
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
