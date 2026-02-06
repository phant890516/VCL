# プロジェクト構成と役割

このプロジェクト「バーチャル・ケミストリー・ラボ (VCL)」のディレクトリ構成と各ファイル・フォルダの主な役割は以下の通りです。

## ルートディレクトリ

- **`backend/`**: バックエンド（Node.js + Express）のソースコードを格納しています。
- **`frontend/`**: フロントエンド（Vite + Three.js）のソースコードを格納しています。
- **`e2e/`**: Playwrightを使用したE2E（End-to-End）テストコードを格納しています。
- **`plain/`**: 静的なHTML/CSSによるモックアップやプロトタイプ置き場です。
- **`package.json`**: プロジェクト全体の依存関係やスクリプトを管理します。

---

## backend/ (バックエンド)

APIサーバーの実装です。三層アーキテクチャ（Controller / Service / Repository）を厳守しています。

- **`src/app.js`**: サーバーのエントリーポイントおよび初期設定。
- **`src/controllers/`**: HTTPリクエストを受け付け、Service層へ処理を委譲し、レスポンスを返します（ビジネスロジックは書きません）。
- **`src/services/`**: ビジネスロジック（計算、判定、フロー制御など）を実装します。
- **`src/repositories/`**: データベースへの直接的なアクセス（CRUD操作）を担当します。
- **`src/models/`**: データベースのモデル定義や型定義。
- **`src/routes/`**: APIのエンドポイント（URL）とControllerの紐付けを行います。
- **`vitest.config.js`**: バックエンドのユニットテスト設定。

---

## frontend/ (フロントエンド)

3D実験室を含むウェブアプリケーションのクライアントサイド実装です。

- **`index.html`**: アプリケーションのエントリーポイントとなるHTMLファイル。
- **`src/main.js`**: JavaScriptのエントリーポイント。アプリケーションの初期化を行います。
- **`src/assets/`**: `styles.css` などの静的リソース（スタイルシート、画像など）。
- **`src/components/`**: 再利用可能なUIパーツ（登録フォーム、サイドバーなど）。
- **`src/scenes/`**: アプリケーションの各画面（シーン）のロジック。
    - `DashboardScene.js`: ダッシュボード画面
    - `LabScene.js`: 3D実験室画面
    - `ResultScene.js`: 実験結果画面
- **`src/hooks/`**: コンポーネントから切り出したロジックや状態管理（Custom Hooks）。
- **`plain/`**: 動作確認用の簡易レイアウトなど。

---

## e2e/ (E2Eテスト)

実際のブラウザ操作をシミュレーションしてシステム全体をテストします。

- **`playwright.config.js`**: Playwrightの設定ファイル。
- **`tests/`**: テストシナリオ。
    - `experiment.spec.js`: 実験フローのテスト
    - `login.spec.js`: ログイン機能のテスト
