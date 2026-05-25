# VCL データベース設計書

## 文書情報

| 項目 | 内容 |
| --- | --- |
| システム名 | バーチャル・ケミストリー・ラボ |
| 文書種別 | データベース設計書 |
| 作成日 | 2026年5月25日 |
| 対象 | SQLite ローカル DB / Supabase 学校運用 DB |

## 1. 目的

この文書は、VCL で扱うデータの保存先、テーブル構造、API との対応を整理するための設計書である。

現行実装では、ローカル開発・プロトタイプ用に SQLite を使用する。一方、先生がクラスを作り、生徒の進捗を管理する学校運用では Supabase を使用する。

## 2. 保存先の使い分け

| 保存先 | 用途 | 主な対象 |
| --- | --- | --- |
| SQLite | ローカル開発、単体デモ、既存 API の保存先 | ユーザー、実験マスタ、学習進捗、トロフィー、メモ |
| Supabase | 学校運用、先生・クラス・生徒単位の管理 | 先生プロフィール、クラス、生徒、進捗、トロフィー |
| LocalStorage | 未ログイン時または通信失敗時の補助保存 | ゲストのトロフィー、ログイン状態、テーマ |

## 3. SQLite 設計

SQLite は `backend/database.sqlite` を使用する。起動時に `backend/src/db/database.js` の `initializeDatabase()` がテーブル、追加カラム、インデックス、実験マスタを初期化する。

### 3.1 users

ローカルログイン用のユーザーを保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | ユーザー内部 ID |
| username | TEXT UNIQUE NOT NULL | ログイン名 |
| email | TEXT UNIQUE | メールアドレス |
| password | TEXT NOT NULL | bcrypt でハッシュ化したパスワード |
| role | TEXT NOT NULL | `student` / `teacher` / `admin` |
| nickname | TEXT | 表示名 |
| full_name | TEXT | 氏名 |
| created_at | DATETIME | 作成日時 |
| updated_at | DATETIME | 更新日時 |

### 3.2 experiments

実験マスタを保存する。`experiment_code` は `frontend/src/data/quests.js` の `exp_01` 形式の ID と対応する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | 実験内部 ID |
| experiment_code | TEXT UNIQUE | `exp_01` 形式の実験コード |
| title | TEXT NOT NULL | 実験名 |
| category | TEXT NOT NULL | 分類。現行は `select_mode` |
| description | TEXT | 実験説明 |
| is_available | INTEGER | 利用可能なら `1` |
| created_at | DATETIME | 作成日時 |
| updated_at | DATETIME | 更新日時 |

### 3.3 user_progress

ローカルユーザーの実験履歴を保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | 進捗内部 ID |
| user_id | INTEGER FK | `users.id` |
| experiment_id | INTEGER FK | `experiments.id` |
| status | TEXT NOT NULL | `started` / `completed` / `failed` |
| played_at | DATETIME | 記録日時 |

### 3.4 user_trophies

ローカルユーザーのトロフィー獲得履歴を保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | トロフィー履歴 ID |
| user_id | INTEGER FK | `users.id` |
| trophy_id | TEXT NOT NULL | `trophy_exp_01` 形式のトロフィー ID |
| acquired_at | DATETIME | 獲得日時 |

制約:

- `UNIQUE(user_id, trophy_id)` により、同一ユーザーへの同一トロフィー重複付与を防ぐ。

### 3.5 login_history

ログインなどの認証関連履歴を保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | 履歴 ID |
| user_id | INTEGER FK | `users.id` |
| action | TEXT NOT NULL | 操作種別 |
| timestamp | DATETIME | 記録日時 |

### 3.6 rooms

将来のルーム・授業運用に備えたテーブル。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | INTEGER PK | ルーム ID |
| room_code | TEXT UNIQUE NOT NULL | 参加コード |
| host_id | INTEGER FK | ルーム作成者の `users.id` |
| status | TEXT | `waiting` などの状態 |
| created_at | DATETIME | 作成日時 |

### 3.7 notes

Idea 画面などで使うユーザーメモを保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| user_id | INTEGER PK/FK | `users.id` |
| content | TEXT | メモ本文 |
| updated_at | DATETIME | 更新日時 |

### 3.8 SQLite インデックス

| インデックス | 対象 | 目的 |
| --- | --- | --- |
| idx_experiments_experiment_code | experiments(experiment_code) | 実験コード検索 |
| idx_user_progress_user_id | user_progress(user_id) | ユーザー別進捗取得 |
| idx_user_progress_experiment_id | user_progress(experiment_id) | 実験別集計 |
| idx_user_trophies_user_id | user_trophies(user_id) | ユーザー別トロフィー取得 |
| idx_login_history_user_id | login_history(user_id) | ユーザー別認証履歴 |
| idx_rooms_host_id | rooms(host_id) | ホスト別ルーム取得 |

## 4. Supabase 設計

Supabase は学校運用を対象とする。先生は Supabase Auth のメールアドレス認証を使い、生徒は先生が発行した生徒 ID と初期パスワードでログインする。

スキーマ定義は `supabase/schema.sql` に置く。

### 4.1 teacher_profiles

Supabase Auth の先生ユーザーに対応するプロフィール。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | `auth.users.id` |
| email | text | 先生のメールアドレス |
| display_name | text | 表示名 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 4.2 classes

先生が作成するクラス。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | クラス ID |
| teacher_id | uuid FK | `teacher_profiles.id` |
| name | text | クラス名 |
| class_code | text UNIQUE | クラス識別コード |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 4.3 students

先生が発行する生徒アカウント。メールアドレスは持たない。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 生徒 ID |
| class_id | uuid FK | `classes.id` |
| login_id | text UNIQUE | 生徒ログイン ID |
| display_name | text | 生徒表示名 |
| password_hash | text | bcrypt でハッシュ化したパスワード |
| must_change_password | boolean | 初回パスワード変更が必要か |
| last_login_at | timestamptz | 最終ログイン日時 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 4.4 experiments

学校運用側の実験マスタ。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 実験 ID |
| experiment_code | text UNIQUE | `exp_01` 形式の実験コード |
| title | text | 実験名 |
| display_order | integer | 表示順 |
| is_available | boolean | 利用可能か |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 4.5 student_progress

生徒ごとの実験進捗を保存する。先生の進捗管理画面で参照する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 進捗 ID |
| student_id | uuid FK | `students.id` |
| experiment_id | uuid FK | `experiments.id` |
| status | text | 進捗状態 |
| progress_percent | integer | 先生画面に表示する進捗率 |
| mixing_progress | numeric | 実験中の混合量 |
| required_mixing | numeric | 完了に必要な混合量 |
| started_at | timestamptz | 開始日時 |
| completed_at | timestamptz | 完了日時 |
| updated_at | timestamptz | 更新日時 |

制約:

- `UNIQUE(student_id, experiment_id)` により、同一実験の進捗は生徒ごとに 1 件へ集約する。

進捗状態:

| status | 表示進捗 | 内容 |
| --- | --- | --- |
| not_started | 0% | 未開始 |
| started | 25% | 実験画面に入った |
| reagent_added | 50% | 正しい薬品を投入した |
| mixing | 50〜99% | 混合中 |
| completed | 100% | 実験成功 |
| failed | 失敗 | 実験失敗 |

### 4.6 student_trophies

生徒ごとのトロフィー獲得履歴。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | トロフィー履歴 ID |
| student_id | uuid FK | `students.id` |
| trophy_id | text | `trophy_exp_01` 形式のトロフィー ID |
| acquired_at | timestamptz | 獲得日時 |

制約:

- `UNIQUE(student_id, trophy_id)` により、同じトロフィーを重複保存しない。

## 5. API 対応

### 5.1 SQLite API

| メソッド | パス | 保存先 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | users | ローカルユーザー登録 |
| POST | `/api/auth/login` | users | ローカルログイン |
| GET | `/api/progress/:userId` | user_progress | 進捗履歴取得 |
| POST | `/api/progress` | user_progress | 進捗保存 |
| GET | `/api/trophies/history/:userId` | user_trophies | トロフィー履歴取得 |
| POST | `/api/trophies/unlock` | user_trophies | トロフィー獲得 |
| GET | `/api/notes/:userId` | notes | メモ取得 |
| POST | `/api/notes` | notes | メモ保存 |

### 5.2 Supabase 学校運用 API

| メソッド | パス | 用途 |
| --- | --- | --- |
| GET | `/api/school/teacher/me` | 先生プロフィール取得 |
| GET | `/api/school/teacher/classes` | クラス一覧取得 |
| POST | `/api/school/teacher/classes` | クラス作成 |
| GET | `/api/school/teacher/classes/:classId/students` | 生徒一覧取得 |
| POST | `/api/school/teacher/classes/:classId/students` | 生徒 ID 発行 |
| GET | `/api/school/teacher/classes/:classId/progress` | クラス進捗ボード取得 |
| POST | `/api/school/students/login` | 生徒ログイン |
| POST | `/api/school/students/change-password` | 生徒パスワード変更 |
| POST | `/api/school/students/progress` | 生徒進捗保存 |
| POST | `/api/school/students/trophies` | 生徒トロフィー保存 |

## 6. セキュリティ方針

- パスワードは平文保存せず、bcrypt でハッシュ化する。
- ブラウザには Supabase の anon / publishable key のみを置き、service role key は置かない。
- 先生向け API は Supabase Auth のアクセストークンを検証する。
- 生徒向け API は VCL 独自の短時間 JWT を検証する。
- Supabase の公開スキーマでは RLS を有効化する。
- 先生は自分のクラスに所属する生徒データのみ参照できる。
- Supabase のトリガー関数は `search_path` を固定し、意図しないスキーマ解決を避ける。
- LocalStorage は正式な保存先ではなく、ゲスト利用または通信失敗時の補助保存とする。
