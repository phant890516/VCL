/**
 * ファイル名: backend/src/db/database.js
 * 概要: SQLite データベース接続と初期スキーマ定義
 */
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

async function hasColumn(tableName, columnName) {
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    return columns.some((column) => column.name === columnName);
}

async function addColumnIfMissing(tableName, columnName, columnDefinition) {
    if (!(await hasColumn(tableName, columnName))) {
        await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
}

async function seedExperiments() {
    const experiments = [
        {
            experiment_code: 'exp_01',
            title: '酸素の発生実験',
            category: 'select_mode',
            description: '二酸化マンガンに過酸化水素水を加え、酸素発生を観察する。',
            is_available: 1
        },
        {
            experiment_code: 'exp_02',
            title: '二酸化炭素の発生実験',
            category: 'select_mode',
            description: '石灰石に塩酸を加え、二酸化炭素発生を観察する。',
            is_available: 1
        },
        {
            experiment_code: 'exp_03',
            title: '金属の溶け方（アルミニウム）',
            category: 'select_mode',
            description: 'アルミニウムに塩酸を加え、水素発生や溶解を観察する。',
            is_available: 1
        },
        {
            experiment_code: 'exp_04',
            title: '石灰水と二酸化炭素の反応',
            category: 'select_mode',
            description: '石灰水の白濁を観察する。',
            is_available: 1
        },
        {
            experiment_code: 'exp_05',
            title: '硝酸銀水溶液の反応',
            category: 'select_mode',
            description: '硝酸銀と食塩水により塩化銀の沈殿を観察する。',
            is_available: 1
        }
    ];

    for (const experiment of experiments) {
        await db.run(
            `
                INSERT INTO experiments (experiment_code, title, category, description, is_available)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(experiment_code) DO UPDATE SET
                    title = excluded.title,
                    category = excluded.category,
                    description = excluded.description,
                    is_available = excluded.is_available,
                    updated_at = CURRENT_TIMESTAMP
            `,
            [
                experiment.experiment_code,
                experiment.title,
                experiment.category,
                experiment.description,
                experiment.is_available
            ]
        );
    }
}

export async function initializeDatabase() {
    const dbPath = path.resolve(__dirname, '../../database.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            nickname TEXT,
            full_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS experiments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_code TEXT UNIQUE,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            is_available INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            experiment_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (experiment_id) REFERENCES experiments(id)
        );

        CREATE TABLE IF NOT EXISTS user_trophies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            trophy_id TEXT NOT NULL,
            acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, trophy_id)
        );

        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_code TEXT UNIQUE NOT NULL,
            host_id INTEGER NOT NULL,
            status TEXT DEFAULT 'waiting',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (host_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS notes (
            user_id INTEGER PRIMARY KEY,
            content TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_progress_experiment_id ON user_progress(experiment_id);
        CREATE INDEX IF NOT EXISTS idx_user_trophies_user_id ON user_trophies(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
    `);

    await addColumnIfMissing('experiments', 'experiment_code', 'TEXT');
    await addColumnIfMissing('experiments', 'is_available', 'INTEGER NOT NULL DEFAULT 1');
    await addColumnIfMissing('experiments', 'created_at', 'DATETIME');
    await addColumnIfMissing('experiments', 'updated_at', 'DATETIME');
    await db.exec(`
        UPDATE experiments SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
        UPDATE experiments SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_experiments_experiment_code ON experiments(experiment_code);
    `);
    await seedExperiments();

    console.log('Database initialized at', dbPath);
    return db;
}

export function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}
