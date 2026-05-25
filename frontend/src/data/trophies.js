/**
 * ファイル名: frontend/src/data/trophies.js
 * 概要: トロフィーの定義データとクライアントサイドAPI
 * 役割:
 *   - 全トロフィーのメタデータ（ID, タイトル, 説明）の定義
 *   - バックエンドAPIとの通信を行うクライアント関数群
 */

export const trophiesData = [
    // 既存のトロフィー
    {
        id: 'experiment_master',
        title: '実験マスター',
        description: 'セレクトモード内の実験を全て成功させた',
        category: 'basics'
    },

    // 1. 実験完了トロフィー (exp_XX に対応)
    {
        id: 'trophy_exp_01',
        title: '酸素マスター',
        description: '「酸素の発生実験」を成功させ、酸素の性質を理解した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_02',
        title: '二酸化炭素マスター',
        description: '「二酸化炭素の発生実験」を成功させ、石灰水の変化を確認した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_03',
        title: 'アルミニウム溶融',
        description: '「金属の溶け方（アルミニウム）」を成功させ、水素の発生を確認した',
        category: 'experiment'
    },
    // {
    //     id: 'trophy_exp_06',
    //     title: '中和ハカセ',
    //     description: '「酸とアルカリの性質調べ」を成功させ、中和反応を体験した',
    //     category: 'experiment'
    // },
    {
        id: 'trophy_exp_04',
        title: '白濁の証',
        description: '「石灰水と二酸化炭素の反応」を成功させ、炭酸カルシウムの生成を確認した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_05',
        title: '沈殿マスター',
        description: '「硝酸銀水溶液の反応」を成功させ、塩化銀の沈殿を確認した',
        category: 'experiment'
    },

    // 2. 実験スキル・テクニック系
    {
        id: 'precise_mixing',
        title: '精密な調合',
        description: 'セレクトモードで、指示された手順を一度も間違えずに最後まで完了した',
        category: 'skill'
    },
    {
        id: 'safety_first',
        title: '安全第一',
        description: '密閉による圧力爆発などの「失敗」をあえて経験し、安全上の注意点をすべて確認した',
        category: 'skill'
    },

    // 3. 探究・フリーモード系
    {
        id: 'young_scientist',
        title: '若き科学者',
        description: 'フリーモードで10種類以上の異なる物質の組み合わせを試した',
        category: 'exploration'
    }
];

const API_BASE = '/api/trophies';
const SCHOOL_API_BASE = '/api/school';
const OFFLINE_STORAGE_KEY = 'vcl_user_trophies_offline';

/**
 * ローカルストレージから現在のユーザーIDを取得（デバッグ用・将来用）
 * @returns {number|null} ユーザーID
 */
function getCurrentUserId() {
    try {
        const user = localStorage.getItem('vcl_user');
        if (!user) return null;
        const parsed = JSON.parse(user);
        if (!parsed || !parsed.id) {
             if (parsed.username === 'Demo User') return 999;
             return null;
        }
        return parsed.id;
    } catch (e) {
        return null;
    }
}

/**
 * 獲得済みトロフィーIDのリストを取得
 * 完全ローカルストレージ動作に変更
 * @returns {Promise<string[]>} トロフィーIDの配列
 */
export async function getAcquiredTrophies() {
    const userId = getCurrentUserId();
    if (userId) {
        try {
            const offlineTrophies = readOfflineTrophies();
            for (const trophyId of offlineTrophies) {
                await saveTrophyToDatabase(userId, trophyId);
            }
            if (offlineTrophies.length > 0) {
                localStorage.removeItem(OFFLINE_STORAGE_KEY);
            }

            const response = await fetch(`${API_BASE}/history/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to load trophies from database');
            }
            const history = await response.json();
            return history.map(item => item.trophy_id);
        } catch (e) {
            console.warn('[Trophy] Falling back to local trophies:', e);
        }
    }

    try {
        const trophies = readOfflineTrophies();
        console.log('[Trophy] Loaded local trophies:', trophies);
        return trophies;
    } catch (e) {
        console.error('[Trophy] Failed to load local trophies:', e);
        return [];
    }
}

/**
 * トロフィーを獲得して保存する
 * 完全ローカルストレージ動作に変更
 * @param {string} trophyId トロフィーID
 * @returns {Promise<boolean>} 新規獲得ならtrue、既に持っていたらfalse
 */
export async function unlockTrophy(trophyId) {
    console.log(`[Trophy] unlockTrophy called for: ${trophyId}`);

    // 正しいIDかチェック
    const isValidId = trophiesData.some(t => t.id === trophyId);
    if (!isValidId) {
        console.warn(`[Trophy] Invalid trophy ID: ${trophyId}`);
        return false;
    }

    const studentToken = localStorage.getItem('vcl_student_token');
    if (studentToken) {
        try {
            // 生徒ログイン時は先生の進捗管理ボードへ反映できるようSupabaseにも同期する。
            await saveStudentTrophyToSupabase(studentToken, trophyId);
        } catch (e) {
            console.warn('[Trophy] Failed to save student trophy to Supabase. Saving locally instead:', e);
        }
    }

    const userId = getCurrentUserId();
    if (userId && !studentToken) {
        try {
            const result = await saveTrophyToDatabase(userId, trophyId);
            return Boolean(result?.success);
        } catch (e) {
            console.warn('[Trophy] Failed to save trophy to database. Saving locally instead:', e);
        }
    }

    try {
        const current = readOfflineTrophies();
        if (current.includes(trophyId)) {
            console.log('[Trophy] Already acquired (Local)');
            return false;
        }

        // 保存
        current.push(trophyId);
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(current));
        console.log('[Trophy] Saved locally:', trophyId);
        return true; // 新規獲得

    } catch (e) {
        console.error('[Trophy] Error saving trophy locally:', e);
    }
}

function readOfflineTrophies() {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

async function saveTrophyToDatabase(userId, trophyId) {
    const response = await fetch(`${API_BASE}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, trophyId })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save trophy');
    }

    return response.json();
}

async function saveStudentTrophyToSupabase(studentToken, trophyId) {
    const response = await fetch(`${SCHOOL_API_BASE}/students/trophies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({ trophyId })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save student trophy');
    }

    return response.json();
}

/**
 * ローカルに保存されたトロフィー情報を全削除する
 * (管理者機能用)
 */
export function resetLocalTrophies() {
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    console.log('[Trophy] Local trophies cleared.');
}

/**
 * トロフィーデータをリセットする（デバッグ用）
 */
export function resetTrophies() {
    console.warn("Reset trophies not implemented for DB yet");
}
