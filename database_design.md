# VCL データベース設計書

## 1. 概要
本プロジェクトではデータベースに **SQLite** を採用します。
アプリケーションの規模（小中学生向け、スタンドアロンに近い運用とクラス単位のリアルタイム同期）を考慮し、軽量かつバックアップが容易な構成とします。

---

## 2. ER図 (概念モデル)

```mermaid
erDiagram
    users ||--o{ user_progress : "実験を行う"
    users ||--o{ user_trophies : "獲得する"
    users ||--o{ login_history : "記録"
    users ||--o{ rooms : "先生が作成"
    rooms ||--o{ room_participants : "生徒が参加"

    experiments ||--o{ user_progress : "参照"
    trophies ||--o{ user_trophies : "参照"

    users {
        int id PK
        string user_id UK "8-32文字, 記号不可"
        string role "teacher/student"
        string password_hash
        string nickname "生徒用"
        string full_name "先生用"
        string email "先生用"
    }

    experiments {
        int id PK
        string title
        string category "tutorial/select/free"
    }

    user_progress {
        int id PK
        int user_id FK
        int experiment_id FK
        string status "success/failure"
        datetime completed_at
    }
```

---

## 3. テーブル定義

### 3.1 ユーザー管理 (users)
生徒および教師のアカウント情報を管理するテーブルです。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | 内部識別ID |
| `username` | TEXT | UNIQUE, NOT NULL | ログイン用ID (英数字, 8-32文字) |
| `password` | TEXT | NOT NULL | ハッシュ化されたパスワード |
| `role` | TEXT | NOT NULL | `student` (生徒) または `teacher` (教師) |
| `nickname` | TEXT | NULLABLE | 生徒の表示名 (記号不可) |
| `full_name` | TEXT | NULLABLE | 教師の氏名 |
| `email` | TEXT | UNIQUE, NULLABLE | 教師の公式メールアドレス |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新日時 |

### 3.2 実験マスタ (experiments)
システムで実施可能な実験リストを管理するマスタテーブルです。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | 実験ID |
| `title` | TEXT | NOT NULL | 実験名 (例: 酸素の発生実験) |
| `category` | TEXT | NOT NULL | `tutorial`, `select`, `free` |
| `description` | TEXT | | 実験の概要・説明 |

### 3.3 実験進捗・履歴 (user_progress)
ユーザーがどの実験を成功/失敗したかを記録します。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | 履歴ID |
| `user_id` | INTEGER | FK (users.id) | 実施したユーザー |
| `experiment_id` | INTEGER | FK (experiments.id) | 実験の種類 |
| `status` | TEXT | NOT NULL | `success` (成功), `failure` (失敗) |
| `played_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 実施日時 |

### 3.4 トロフィーマスタ (trophies)
獲得可能なトロフィーの定義情報です。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | トロフィーID |
| `title` | TEXT | NOT NULL | トロフィー名 |
| `description` | TEXT | NOT NULL | 獲得条件の説明 |
| `condition_code` | TEXT | NOT NULL | プログラム判定用コード |
| `icon_path` | TEXT | | アイコン画像のパス |

### 3.5 獲得トロフィー (user_trophies)
ユーザーが実際に獲得したトロフィーを紐付けます。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | ID |
| `user_id` | INTEGER | FK (users.id) | ユーザー |
| `trophy_id` | INTEGER | FK (trophies.id) | 獲得したトロフィー |
| `acquired_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 獲得日時 |

### 3.6 ログイン履歴 (login_history)
要件「3.5 ログアウトの日時を登録」に対応するための監査ログテーブルです。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | ログID |
| `user_id` | INTEGER | FK (users.id) | 対象ユーザー |
| `action` | TEXT | NOT NULL | `login` または `logout` |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 操作日時 |

### 3.7 クラスルーム (rooms) - アクティビティモード用
教師が作成する一時的な部屋情報の管理。

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AUTOINCREMENT | 内部ID |
| `room_code` | TEXT | UNIQUE, NOT NULL | 参加用4桁パスコード |
| `host_id` | INTEGER | FK (users.id) | 作成した教師 |
| `status` | TEXT | DEFAULT 'active' | `waiting`, `active`, `closed` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 作成日時 |

---

## 4. 初期化SQL (実行用)

```sql
-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  nickname TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 実験マスタ
CREATE TABLE IF NOT EXISTS experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

-- 実験履歴
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  experiment_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (experiment_id) REFERENCES experiments(id)
);

-- トロフィーマスタ
CREATE TABLE IF NOT EXISTS trophies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  condition_code TEXT NOT NULL,
  icon_path TEXT
);

-- トロフィー獲得状況
CREATE TABLE IF NOT EXISTS user_trophies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  trophy_id INTEGER NOT NULL,
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trophy_id) REFERENCES trophies(id),
  UNIQUE(user_id, trophy_id)
);

-- ログイン履歴
CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout')),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- アクティビティルーム
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT UNIQUE NOT NULL,
  host_id INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id)
);
```
