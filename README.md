# 🧪 VCL — Virtual Chemistry Lab

> 小学校高学年〜中学生向けの体験型化学実験 Web アプリ

Nintendo Joy-Con を実験器具の代わりとして使い、PC のブラウザ上で 3D の化学実験を安全に体験できる学習アプリです。

---

## 📖 概要

危険な試薬を実際に扱わずに、化学実験の流れや反応の変化を体験できます。Joy-Con を傾けたり振ったりすることで、試験管やフラスコを操作し、液体の色変化・泡・沈殿などの反応をリアルタイムで観察できます。

### 主な特徴

- **Joy-Con 操作**: 傾ける・振る・混ぜるといった実験操作を体感
- **3D 実験室**: Three.js による本格的な 3D 実験画面
- **5 種類の実験クエスト**: 実際の中学理科に対応した実験を収録
- **学校運用サポート**: 先生がクラスと生徒を管理し、進捗をリアルタイムで確認
- **トロフィーシステム**: 実験成功で実績を解除

---

## 🔬 収録実験

| ID | 実験名 | 内容 |
|---|---|---|
| exp_01 | 酸素の発生実験 | 二酸化マンガン＋過酸化水素水 → 酸素発生 |
| exp_02 | 二酸化炭素の発生実験 | 石灰石＋塩酸 → CO₂ 発生・石灰石溶解 |
| exp_03 | 金属の溶け方（アルミニウム） | アルミニウム＋塩酸 → 水素発生・溶解 |
| exp_04 | 石灰水と二酸化炭素の反応 | CO₂ を通すと白濁 |
| exp_05 | 硝酸銀水溶液の反応 | AgNO₃＋NaCl → 白色沈殿（AgCl） |

---

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Vite / JavaScript ES Modules / Three.js / Socket.IO Client |
| バックエンド | Node.js / Express / Socket.IO |
| Joy-Con 通信 | node-hid |
| データベース | Supabase（学校運用） / LocalStorage（ゲスト） |
| テスト | Vitest / Playwright |

---

## 🚀 セットアップ

### 必要環境

- Node.js v20 以上
- npm v8 以上
- Nintendo Joy-Con（L または R）とそれをペアリング済みの PC

### インストール

```bash
git clone <repository-url>
cd vcl-project
npm install
```

### 環境変数の設定

**バックエンド** (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VCL_JWT_SECRET=replace-with-long-random-secret
ALLOW_UNVERIFIED_TEACHERS=false
```

> `backend/.env.example` をコピーして編集してください。

**フロントエンド** (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> `frontend/.env.example` をコピーして編集してください。

### 開発サーバーの起動

```bash
# バックエンドとフロントエンドを同時起動
npm run dev

# 個別に起動する場合
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

---

## 🎮 Joy-Con の接続方法

1. PC の Bluetooth 設定を開く
2. Joy-Con 側面の **シンクロボタン** を長押し（LED が流れるように点滅）
3. PC のデバイス一覧に `Joy-Con (L)` または `Joy-Con (R)` が表示されたら選択して接続
4. アプリの **接続ガイド** 画面で接続状態と角度を確認

> Joy-Con が 2 本ある場合、1 本目が試験管（左）、2 本目がフラスコ（右）に割り当てられます。

---

## 🏫 学校運用機能

### 先生向け

- Supabase Auth でメール認証ログイン
- クラスの作成・管理
- 生徒 ID（`クラスコード-出席番号` 形式）と初期パスワードの発行
- クラス全体の実験進捗をリアルタイムで確認

### 生徒向け

- 先生から配布された ID とパスワードでログイン（メールアドレス不要）
- 初回ログイン後にパスワード変更
- 実験進捗・トロフィーが先生のダッシュボードに反映

### Supabase のスキーマ適用

```bash
# Supabase ダッシュボードの SQL エディタで実行
supabase/schema.sql
```

---

## 📁 プロジェクト構成

```
vcl-project/
├── backend/
│   └── src/
│       ├── app.js                  # エントリーポイント
│       ├── controllers/            # リクエスト処理
│       ├── services/               # ビジネスロジック
│       │   ├── joyconService.js    # Joy-Con HID 通信
│       │   └── schoolService.js   # 学校運用ロジック
│       ├── repositories/           # DB アクセス
│       ├── routes/                 # API ルーティング
│       └── middleware/             # 認証ミドルウェア
├── frontend/
│   └── src/
│       ├── main.js                 # SPA エントリーポイント
│       ├── router.js               # History API ルーター
│       ├── scenes/
│       │   └── LabScene.js         # Three.js 実験室シーン
│       ├── views/                  # 各画面コンポーネント
│       │   ├── Dashboard/
│       │   ├── Lab/
│       │   ├── SelectMode/
│       │   ├── Trophy/
│       │   └── ...
│       └── data/
│           ├── quests.js           # 実験クエスト定義（ここを編集）
│           ├── trophies.js         # トロフィー定義
│           └── explanations/       # 実験解説 HTML
├── supabase/
│   └── schema.sql                  # DB スキーマ
└── docs/
    ├── requirements.md             # 要件定義書
    ├── database_design.md          # DB 設計書
    ├── screen_spec.md              # 画面仕様書
    └── quest_manual.md             # クエスト追加マニュアル
```

---

## ➕ 実験クエストの追加方法

`frontend/src/data/quests.js` を編集するだけで新しい実験を追加できます。バックエンドの変更は不要です。

```js
{
    id: 'exp_06',
    title: '実験名',
    desc: 'セレクト画面に表示される説明文',
    materials: '使用物質A, 使用物質B',
    available: true,
    mission: '実験画面に表示される指示文',
    scene: {
        flaskSolid: 'limestone',  // 'manganeseOxide' | 'limestone' | 'aluminum'
        initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
    },
    toolbarActions: [
        {
            label: '塩酸',
            chemical: { Name: '塩酸', Symbol: 'HCl', Appearance: '無色透明液体' }
        }
    ],
    reaction: {
        reactant: { acceptedNames: ['塩酸', 'HCl'] },
        completeAt: 300,
        effects: {
            liquidColor: 0xffffff,
            bubbles: true,
            dissolveSolid: 'limestone'
        }
    },
    trophyId: 'trophy_exp_06',
    explanationHtml: exp06Explanation
}
```

詳細は [クエスト追加マニュアル](docs/quest_manual.md) を参照してください。

---

## 🧪 テスト

```bash
# バックエンドのユニットテスト
npm run test:backend

# フロントエンドのユニットテスト
npm run test:frontend

# E2E テスト（Playwright）
npm run test:e2e
```

---

## 📚 ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](docs/requirements.md) | システム全体の要件・仕様 |
| [DB 設計書](docs/database_design.md) | Supabase テーブル設計・API 対応 |
| [画面仕様書](docs/screen_spec.md) | 各画面の表示・操作・保存処理 |
| [クエスト追加マニュアル](docs/quest_manual.md) | 実験クエストの追加・編集方法 |

---

## 🔑 API エンドポイント

### 学校運用 API

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/school/teacher/me` | 先生プロフィール取得 |
| `GET` | `/api/school/teacher/classes` | クラス一覧取得 |
| `POST` | `/api/school/teacher/classes` | クラス作成 |
| `GET` | `/api/school/teacher/classes/:id/students` | 生徒一覧取得 |
| `POST` | `/api/school/teacher/classes/:id/students` | 生徒 ID 発行 |
| `GET` | `/api/school/teacher/classes/:id/progress` | クラス進捗取得 |
| `POST` | `/api/school/students/login` | 生徒ログイン |
| `POST` | `/api/school/students/change-password` | パスワード変更 |
| `POST` | `/api/school/students/progress` | 進捗保存 |
| `POST` | `/api/school/students/trophies` | トロフィー保存 |

---

## ⚠️ 注意事項

- Joy-Con はブラウザから直接接続できません。バックエンドサーバーが起動している必要があります
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみで使用し、フロントエンドには絶対に置かないでください
- 本番環境では `VCL_JWT_SECRET` に十分に長いランダム文字列を設定してください

---

## 📄 ライセンス

本プロジェクトは学習・研究目的で開発されています。
