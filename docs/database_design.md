# VCL データベース設計書

## 文書情報

| 項目 | 内容 |
| --- | --- |
| システム名 | バーチャル・ケミストリー・ラボ |
| 文書種別 | データベース設計書 |
| 更新日 | 2026年6月8日 |
| 対象 | Supabase 学校運用 DB / 未実装DBの記入欄 |

## 1. 目的

この文書は、VCL で扱うデータの保存先、テーブル構成、API との対応を整理するための設計書である。

旧ローカルDBの実装は削除し、現時点では学校運用を想定した Supabase 設計を中心に扱う。通常ログインユーザー向けの保存処理は、今日の共同作業で決めるため、コード上には `TODO: ここに書く` という形で実装場所だけ残している。

## 2. 保存先の使い分け

| 保存先 | 用途 | 現在の扱い |
| --- | --- | --- |
| Supabase | 先生、クラス、生徒、進捗、トロフィー | 学校運用の主DBとして使用 |
| LocalStorage | ゲスト利用、DB未実装部分の一時保存 | トロフィーなどの補助保存に使用 |
| 未実装DB欄 | 通常ログインユーザー、メモ、通常進捗など | 今日の共同作業で実装予定 |

## 3. Supabase テーブル設計

Supabase のスキーマは `supabase/schema.sql` に定義する。

### 3.1 teacher_profiles

先生プロフィールを保存する。先生は Supabase Auth のメール認証を使う。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | `auth.users.id` と対応する先生ID |
| email | text | 先生のメールアドレス |
| display_name | text | 画面表示名 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3.2 classes

先生が作成するクラスを保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | クラスID |
| teacher_id | uuid FK | 管理する先生ID |
| name | text | クラス名 |
| class_code | text UNIQUE | クラス識別コード |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3.3 students

生徒アカウントを保存する。生徒はメールアドレスを持たず、先生が発行したIDでログインする。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 生徒ID |
| class_id | uuid FK | 所属クラスID |
| login_id | text UNIQUE | 生徒ログインID |
| display_name | text | 画面表示名 |
| password_hash | text | ハッシュ化済みパスワード |
| must_change_password | boolean | 初回パスワード変更が必要か |
| last_login_at | timestamptz | 最終ログイン日時 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3.4 experiments

実験マスタを保存する。`experiment_code` は `frontend/src/data/quests.js` の `exp_01` 形式と対応する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 実験ID |
| experiment_code | text UNIQUE | `exp_01` 形式の実験コード |
| title | text | 実験名 |
| display_order | integer | 表示順 |
| is_available | boolean | 生徒に公開するか |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### 3.5 student_progress

生徒ごとの実験進捗を保存する。先生の進捗管理ボードで参照する中心データである。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 進捗ID |
| student_id | uuid FK | 対象の生徒ID |
| experiment_id | uuid FK | 対象の実験ID |
| status | text | 進捗状態 |
| progress_percent | integer | 画面表示用の進捗率 |
| mixing_progress | numeric | 現在の混ぜ量 |
| required_mixing | numeric | 必要な混ぜ量 |
| started_at | timestamptz | 開始日時 |
| completed_at | timestamptz | 完了日時 |
| updated_at | timestamptz | 更新日時 |

| status | 意味 |
| --- | --- |
| not_started | 未開始 |
| started | 実験画面に入った |
| reagent_added | 正しい薬品を投入した |
| mixing | 混合中 |
| completed | 実験成功 |
| failed | 実験失敗 |

### 3.6 student_trophies

生徒ごとのトロフィー獲得履歴を保存する。

| カラム | 型 | 内容 |
| --- | --- | --- |
| id | uuid PK | 獲得履歴ID |
| student_id | uuid FK | 対象の生徒ID |
| trophy_id | text | `trophy_exp_01` 形式のトロフィーID |
| acquired_at | timestamptz | 獲得日時 |

## 4. API 対応

### 4.1 Supabase 学校運用 API

| メソッド | パス | 用途 |
| --- | --- | --- |
| GET | `/api/school/teacher/me` | 先生プロフィール取得 |
| GET | `/api/school/teacher/classes` | クラス一覧取得 |
| POST | `/api/school/teacher/classes` | クラス作成 |
| GET | `/api/school/teacher/classes/:classId/students` | 生徒一覧取得 |
| POST | `/api/school/teacher/classes/:classId/students` | 生徒ID発行 |
| GET | `/api/school/teacher/classes/:classId/progress` | クラス進捗取得 |
| POST | `/api/school/students/login` | 生徒ログイン |
| POST | `/api/school/students/change-password` | 生徒パスワード変更 |
| POST | `/api/school/students/progress` | 生徒進捗保存 |
| POST | `/api/school/students/trophies` | 生徒トロフィー保存 |

### 4.2 今日書く予定のAPI欄

以下はルートやRepositoryの置き場だけ残している。DB設計を決めたら、各ファイルの `TODO: ここに...を書く` コメントの下に実装する。

| パス | 現在の状態 | 書く場所 |
| --- | --- | --- |
| `/api/auth/*` | 通常ログイン用の形だけ残す | `backend/src/repositories/userRepository.js` |
| `/api/progress/*` | 通常進捗用の形だけ残す | `backend/src/repositories/progressRepository.js` |
| `/api/trophies/*` | 通常トロフィー用の形だけ残す | `backend/src/repositories/trophyRepository.js` |
| `/api/notes/*` | メモ用の形だけ残す | `backend/src/repositories/noteRepository.js` |
| DB初期化 | サーバー起動時には実行しない | `backend/src/db/database.js` / `backend/src/app.js` |

## 5. セキュリティ方針

- 先生は Supabase Auth のメール認証を利用する。
- 生徒はメールアドレスを持たず、先生が発行したログインIDを利用する。
- パスワードは平文保存せず、必ずハッシュ化して保存する。
- ブラウザに service role key は置かない。
- Supabase では RLS を有効化し、先生は自分のクラスに所属する生徒データのみ参照できる。
- ゲスト利用やDB未実装部分では、正式な保存先としてではなく LocalStorage を一時利用する。
