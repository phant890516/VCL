import { io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Helper Functions & Constants Start ---

const KEYS = {
    NAME: ["Name", "名称", "name"],
    EN_NAME: ["EnglishName", "英語名", "englishName"],
    APP: ["Appearance", "外観", "appearance"],
    MP: ["MeltingPoint", "融点", "meltingPoint"],
    BP: ["BoilingPoint", "沸点", "boilingPoint"],
    MW: ["MolecularWeight", "分子量", "molecularWeight"],
    GHS: ["GHSClassification", "GHS分類", "ghsClassification"],
    CID: ["CID", "PubChem_CID", "cid"]
};

// 色のマッピング辞書
const COLOR_KEYWORDS = {
    "無色": 0xffffff, "透明": 0xffffff, "Colorless": 0xffffff, "Clear": 0xffffff,
    "白": 0xffffff, "White": 0xffffff,
    "黒": 0x333333, "Black": 0x333333,
    "赤": 0xff0000, "Red": 0xff0000,
    "青": 0x0000ff, "Blue": 0x0000ff,
    "黄": 0xffff00, "Yellow": 0xffff00, "Amber": 0xffbf00, "Pale yellow": 0xffffcc, "淡黄色": 0xffffcc, "Yellowish": 0xffffcc,
    "緑": 0x008000, "Green": 0x008000,
    "橙": 0xffa500, "Orange": 0xffa500,
    "紫": 0x800080, "Purple": 0x800080, "Violet": 0xee82ee,
    "茶": 0x8b4513, "Brown": 0x8b4513, "褐色": 0x8b4513,
    "銀": 0xc0c0c0, "Silver": 0xc0c0c0, "灰": 0x808080, "Gray": 0x808080, "Grey": 0x808080,
    "ピンク": 0xffc0cb, "Pink": 0xffc0cb, "桃": 0xffc0cb,
    "金": 0xffd700, "Gold": 0xffd700,
    "錫白色": 0xddeeff,
    "白金": 0xe5e4e2
};

// 元素ごとの固有定義
const ELEMENT_SPECIFIC_DATA = {
    "水素": { type: "gas", color: null },
    "ヘリウム": { type: "gas", color: null },
    "リチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ベリリウム": { type: "metal_ingot", color: 0xcccccc },
    "ホウ素": { type: "solid_powder", color: 0x333333 },
    "炭素": { type: "solid_powder", color: 0x111111 },
    "窒素": { type: "gas", color: null },
    "酸素": { type: "gas", color: null },
    "フッ素": { type: "gas", color: 0xffffcc },
    "ネオン": { type: "gas", color: null },
    "ナトリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "マグネシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アルミニウム": { type: "metal_ingot", color: 0xddeeff },
    "ケイ素": { type: "metal_ingot", color: 0x444466 },
    "リン": { type: "solid_powder", color: 0x8b0000 },
    "硫黄": { type: "solid_powder", color: 0xffff00 },
    "塩素": { type: "gas", color: 0xccffcc },
    "アルゴン": { type: "gas", color: null },
    "カリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "カルシウム": { type: "metal_ingot", color: 0xcccccc },
    "スカンジウム": { type: "metal_ingot", color: 0xcccccc },
    "チタン": { type: "metal_ingot", color: 0xaaaaaa },
    "バナジウム": { type: "metal_ingot", color: 0xaaaaaa },
    "クロム": { type: "metal_ingot", color: 0xaaaaaa },
    "マンガン": { type: "metal_ingot", color: 0xaaaaaa },
    "鉄": { type: "metal_ingot", color: 0x888888 },
    "コバルト": { type: "metal_ingot", color: 0xaaaaaa },
    "ニッケル": { type: "metal_ingot", color: 0xcccccc },
    "銅": { type: "metal_ingot", color: 0xb87333 },
    "亜鉛": { type: "metal_ingot", color: 0xaaaaaa },
    "ガリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ゲルマニウム": { type: "metal_ingot", color: 0x666666 },
    "ヒ素": { type: "solid_crystal", color: 0x888888 },
    "セレン": { type: "solid_powder", color: 0x333333 },
    "臭素": { type: "liquid", color: 0x8b0000 },
    "クリプトン": { type: "gas", color: null },
    "ルビジウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ストロンチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "イットリウム": { type: "metal_ingot", color: 0xcccccc },
    "ジルコニウム": { type: "metal_ingot", color: 0xcccccc },
    "ニオブ": { type: "metal_ingot", color: 0xcccccc },
    "モリブデン": { type: "metal_ingot", color: 0xcccccc },
    "テクネチウム": { type: "metal_ingot", color: 0xcccccc },
    "ルテニウム": { type: "metal_ingot", color: 0xcccccc },
    "ロジウム": { type: "metal_ingot", color: 0xcccccc },
    "パラジウム": { type: "metal_ingot", color: 0xcccccc },
    "銀": { type: "metal_ingot", color: 0xc0c0c0 },
    "カドミウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "インジウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "スズ": { type: "metal_ingot", color: 0xc0c0c0 },
    "アンチモン": { type: "metal_ingot", color: 0xc0c0c0 },
    "テルル": { type: "solid_crystal", color: 0xcccccc },
    "ヨウ素": { type: "solid_crystal", color: 0x330033 },
    "キセノン": { type: "gas", color: null },
    "セシウム": { type: "metal_ingot", color: 0xffd700 },
    "バリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ランタン": { type: "metal_ingot", color: 0xc0c0c0 },
    "セリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プラセオジム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ネオジム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プロメチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "サマリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ユウロピウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ガドリニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "テルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ジスプロシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ホルミウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "エルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ツリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "イッテルビウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ルテチウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ハフニウム": { type: "metal_ingot", color: 0xcccccc },
    "タンタル": { type: "metal_ingot", color: 0x444455 },
    "タングステン": { type: "metal_ingot", color: 0xcccccc },
    "レニウム": { type: "metal_ingot", color: 0xcccccc },
    "オスミウム": { type: "metal_ingot", color: 0xaaaaee },
    "イリジウム": { type: "metal_ingot", color: 0xccccc0 },
    "白金": { type: "metal_ingot", color: 0xe5e4e2 },
    "金": { type: "metal_ingot", color: 0xffd700 },
    "水銀": { type: "liquid", color: 0xc0c0c0 },
    "タリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "鉛": { type: "metal_ingot", color: 0x888888 },
    "ビスマス": { type: "metal_ingot", color: 0xffcccc },
    "ポロニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アスタチン": { type: "solid_crystal", color: 0x111111 },
    "ラドン": { type: "gas", color: null },
    "フランシウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ラジウム": { type: "metal_ingot", color: 0xffffff },
    "アクチニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "トリウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プロトアクチニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "ウラン": { type: "metal_ingot", color: 0xc0c0c0 },
    "ネプツニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "プルトニウム": { type: "metal_ingot", color: 0xc0c0c0 },
    "アメリシウム": { type: "metal_ingot", color: 0xc0c0c0 }
};

const METAL_KEYWORDS = ["metal", "alloy", "ingot", "金属"];

function getValue(chem, keyArray) {
    if (!Array.isArray(keyArray)) return chem[keyArray];
    for (const k of keyArray) {
        if (chem[k] !== undefined && chem[k] !== null && chem[k] !== "")
          return chem[k];
    }
    return null;
}

function parseColor(text) {
    if (!text) return 0xcccccc;
    if (text.includes("錫白色")) return 0xddeeff;
    if (text.includes("白金")) return 0xe5e4e2;
    let safeText = text.replace(/金属/g, "METAL_GENERIC");
    let foundHex = 0xcccccc;
    let matched = false;
    for (const [key, hex] of Object.entries(COLOR_KEYWORDS)) {
        if (safeText.includes(key)) {
            foundHex = hex;
            matched = true;
        }
    }
    if (safeText.includes("無色") || safeText.includes("Colorless")) return 0xffffff;
    if (safeText.includes("青み")) return 0xaaccff;
    return matched ? foundHex : 0xeeeeee;
}

function isTransparent(text) {
    if (!text) return false;
    return text.includes("無色") || text.includes("Colorless") || text.includes("透明") || text.includes("Clear") || text.includes("液体");
}

function determineType(chem) {
    const name = (getValue(chem, KEYS.NAME) || "").trim();
    const app = (getValue(chem, KEYS.APP) || "").toLowerCase();
    const enName = (getValue(chem, KEYS.EN_NAME) || "").trim();

    if (ELEMENT_SPECIFIC_DATA[name]) return ELEMENT_SPECIFIC_DATA[name].type;

    const nameLower = name.toLowerCase();
    const enNameLower = enName.toLowerCase();
    const metals = ["iron", "copper", "aluminum", "aluminium", "zinc", "silver", "gold", "lead", "tin", "magnesium", "nickel", "cobalt", "chromium", "manganese", "titanium", "uranium", "plutonium", "鉄", "銅", "アルミニウム", "亜鉛", "銀", "金", "鉛", "スズ", "マグネシウム", "ニッケル", "コバルト", "クロム", "マンガン", "チタン", "ウラン", "プルトニウム"];
    const nonMetalKeywords = ["oxide", "sulfate", "chloride", "nitrate", "carbonate", "hydroxide", "acid", "water", "solution", "酸化", "硫酸", "塩化", "硝酸", "炭酸", "水酸化", "酸", "水"];

    let isMetalName = false;
    for (const m of metals) {
        if (nameLower.includes(m) || enNameLower.includes(m)) {
            isMetalName = true;
            break;
        }
    }
    if (!isMetalName) {
         for (const k of METAL_KEYWORDS) {
             if (app.includes(k)) {
                 isMetalName = true;
                 break;
             }
         }
    } else if (!isMetalName && (app.includes("金属") || app.includes("metal"))) {
        isMetalName = true;
    }

    if (isMetalName) {
        let isCompound = false;
        for (const nm of nonMetalKeywords) {
            if (nameLower.includes(nm) || enNameLower.includes(nm)) {
                isCompound = true; break;
            }
        }
        if (app.includes("liquid") || app.includes("solution") || app.includes("液体") || app.includes("水溶液")) {
                isCompound = true;
        }
        if (!isCompound) return "metal_ingot";
    }

    if (app.includes("liquid") || app.includes("solution") || app.includes("液体") || app.includes("水溶液")) {
        return "liquid";
    }

    if (nameLower.includes("hydroxide") || nameLower.includes("水酸化") || app.includes("pellet") || app.includes("粒") || app.includes("granule")) {
            return "solid_pellet";
    }

    if (app.includes("crystal") || app.includes("結晶") || nameLower.includes("sulfate") || nameLower.includes("chloride") || nameLower.includes("nitrate") || nameLower.includes("salt") || nameLower.includes("sugar") || nameLower.includes("alum") || nameLower.includes("硫酸") || nameLower.includes("塩化") || nameLower.includes("硝酸")) {
        return "solid_crystal";
    }

    if (app.includes("powder") || app.includes("粉") || nameLower.includes("oxide") || nameLower.includes("carbonate") || nameLower.includes("bicarbonate") || nameLower.includes("酸化") || nameLower.includes("炭酸") || nameLower.includes("重曹")) {
        return "solid_powder";
    }

    if (app.includes("solid") || app.includes("固体")) {
        return "solid_powder";
    }

    return "liquid";
}

// --- Helper Functions End ---

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
            if (Math.abs(this.targetRotationZ - this.testTubeGroup.rotation.z) > 0.001) {
                this.testTubeGroup.rotation.z += (this.targetRotationZ - this.testTubeGroup.rotation.z) * 0.1;
            }
        }

        // --- 注ぐモーションのロジック ---
        if (this.testTubeGroup) {
            // 現在のZ軸回転角度を取得
            // 元々の実装では絶対値を取っていたが、傾ける方向によって正負が変わるため
            // ちゃんと符号考慮するか、あるいは絶対値で「傾き量」を見る
            const rotationZ = Math.abs(this.testTubeGroup.rotation.z);
            // 閾値: 60度以上傾けると出るように変更 (ユーザー要望)
            const threshold = THREE.MathUtils.degToRad(60);

            if (rotationZ >= threshold) {
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
                if (this.currentChemicalName && this.experimentId === 'exp_01_o2' && this.flaskLiquidMesh) {
                     // 簡易名称チェック
                    if (this.currentChemicalName.includes('過酸化水素') ||
                        this.currentChemicalName === '酸素' ||
                        this.currentChemicalName === '水素'
                    ) {
                        this.flaskLiquidMesh.visible = true;
                        // 徐々にスケールアップ (初期高さ2.5 * scale.y)
                        // scale.y = 1.0 でフラスコの肩口あたり
                        if (this.flaskLiquidMesh.scale.y < 1.2) {
                            this.flaskLiquidMesh.scale.y += 0.005;
                        }

                        // ★混合演出: 色を変化させる (薄い水色 -> 黒っぽい灰色へ)
                        // 初期: 0xaaccff -> 目標: 0x222222 (ほぼ黒)
                        if (this.flaskLiquidMesh.material && this.flaskLiquidMesh.material.color) {
                            const currentColor = this.flaskLiquidMesh.material.color;
                            // Lerpで徐々に目標色へ
                            currentColor.lerp(new THREE.Color(0x222222), 0.01);

                            // 不透明度も上げて「混ざってる感」を出す
                            if (this.flaskLiquidMesh.material.opacity < 0.95) {
                                this.flaskLiquidMesh.material.opacity += 0.002;
                            }
                        }

// ★修正: 二酸化マンガン（粉末）は液体に混ざると徐々に見えなくなり、黒い液体だけになる演出
                        if (this.manganeseOxideParticles && this.manganeseOxideParticles.material) {
                            // 液面がある程度上がったら
                            if (this.flaskLiquidMesh.scale.y > 0.1) {
                                // 拡散（Y方向に少し広がる）
                                const targetScale = this.flaskLiquidMesh.scale.y * 2.0;
                                if (targetScale > 0.1 && this.manganeseOxideParticles.scale.y < targetScale) {
                                    this.manganeseOxideParticles.scale.y += 0.01;
                                    this.manganeseOxideParticles.position.y += 0.005;
                                }

                                // 不透明度を下げて消していく
                                // 液面がある程度 (0.3以上) になったらフェードアウト開始
                                if (this.flaskLiquidMesh.scale.y > 0.3) {
                                    if (this.manganeseOxideParticles.material.opacity > 0) {
                                        this.manganeseOxideParticles.material.opacity -= 0.01;
                                        if (this.manganeseOxideParticles.material.opacity < 0) {
                                            this.manganeseOxideParticles.material.opacity = 0;
                                            this.manganeseOxideParticles.visible = false;
                                        }
                                    }
                                }
                            }
                        }

                        // 反応開始 (ある程度液面が溜まったら)
                        // scale.y が 0.4 (高さ1.0程度) を超えたあたりで反応開始
                        if (!this.isReacting && this.flaskLiquidMesh.scale.y > 0.4) {
                            this.startReaction('oxygen');
                        }

                        // 完全に混ざり切ったら (scale.y が 1.0 を超えたら)
                        if (this.flaskLiquidMesh.scale.y > 1.0 && !this.isCompleted) {
                            this.isCompleted = true;
                            if (this.onExperimentComplete) {
                                this.onExperimentComplete('exp_01_o2');
                            }
                        }
                    } // end if check chemical name
                } // end if flaskLiquidMesh exists

            } else {
                this.isPouring = false;
            }
        }

        this.updateParticles();
        this.updateReactionParticles(); // 反応エフェクト更新

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
        // バックエンドに接続 (ハードコードされていますが、環境変数などが望ましい)
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

            // groupが生成される前にデータが来ることがあるのでチェック
            if (this.testTubeGroup && !isNaN(angleVal)) {

                // 角度の正規化: 0~360度で来る場合も考慮して -180 ~ 180 に収める
                // これにより「右に傾けると350度になってしまい、反対側に回ろうとする」等を防ぐ
                while (angleVal > 180) angleVal -= 360;
                while (angleVal <= -180) angleVal += 360;

                this.lastRawAngle = angleVal; // 正規化後の値を保存

                // キャリブレーション補正
                let adjustedAngle = angleVal - this.calibrationOffset;

                // 補正後も再度正規化（オフセットで範囲外に出る可能性があるため）
                while (adjustedAngle > 180) adjustedAngle -= 360;
                while (adjustedAngle <= -180) adjustedAngle += 360;

                // --- 移動平均フィルタ (過去5フレームの平均に短縮してラグを減らす) ---
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

                // デバッグ用: 計算された角度をログに出力して確認
                // console.log(`[LabScene] Final Angle: ${finalAngle}, Raw: ${angleVal}`);

                // --- 稼働範囲の制限 & 符号反転 ---
                // Joy-Conのジャイロの取り付け向きによっては、逆回転になることがあるため、
                // ここで符号を反転させる (-1をかける) と改善する場合がある
                // ユーザーからの「反映されない」というより「見た目がおかしい」場合に備え調整
                // (前回の修正でinvertedを直したが、もし何も動かないなら0になっている可能性がある)

                // 角度制限: -120 ~ 120
                let finalAngle = THREE.MathUtils.clamp(averageAngle, -120, 120);

                // 目標角度を更新 (Degree -> Radian)
                // 試験管はZ軸回転で傾ける
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
