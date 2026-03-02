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
        id: 'initial_login',
        title: 'はじめの一歩',
        description: '初回ログインを完了した',
        category: 'basics'
    },
    {
        id: 'tutorial_complete',
        title: '実験の基礎',
        description: 'チュートリアルを最後まで完了した',
        category: 'basics'
    },
    {
        id: 'experiment_master',
        title: '実験マスター',
        description: 'セレクトモード内の実験を全て成功させた',
        category: 'basics'
    },

    // 1. 実験完了トロフィー (exp_XX に対応)
    {
        id: 'trophy_exp_01_o2',
        title: '酸素マスター',
        description: '「酸素の発生実験」を成功させ、酸素の性質を理解した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_02_co2',
        title: '二酸化炭素マスター',
        description: '「二酸化炭素の発生実験」を成功させ、石灰水の変化を確認した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_03_al',
        title: 'アルミニウム溶融',
        description: '「金属の溶け方（アルミニウム）」を成功させ、水素の発生を確認した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_06_neutral',
        title: '中和ハカセ',
        description: '「酸とアルカリの性質調べ」を成功させ、中和反応を体験した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_07_lime',
        title: '白濁の証',
        description: '「石灰水と二酸化炭素の反応」を成功させ、炭酸カルシウムの生成を確認した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_09_ag',
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
        id: 'temperature_magician',
        title: '温度の魔術師',
        description: '加熱が必要な実験（食塩水の蒸発や酸化銅の還元など）で、最適な温度管理を維持して成功させた',
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
    },
    {
        id: 'all_reactions_conquered',
        title: '全反応制覇',
        description: '要件定義書に記載されている11種類の実験（酸素発生から鉄と硫黄の反応まで）をすべて一度は実行した',
        category: 'exploration'
    },
    {
        id: 'light_in_darkness',
        title: '暗闇の光',
        description: 'マグネシウムの燃焼実験を行い、強い白色光を発生させた',
        category: 'exploration'
    },

    // 4. ソーシャル・アクティビティ系
    {
        id: 'class_role_model',
        title: 'クラスの模範',
        description: 'アクティビティモードにおいて、教師（主催者）に送信される進捗情報が常に「成功」で完了した',
        category: 'social'
    },
    {
        id: 'experiment_buddy',
        title: '実験仲間',
        description: 'アクティビティモードのルームに合計5回以上参加した',
        category: 'social'
    }
];

const API_BASE = 'http://localhost:3000/api/trophies';
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
    try {
        // ユーザーIDに関係なく、ブラウザ固有のストレージを使用する
        // (以前のロジックだとユーザーごとのDB保存だったが、今回はブラウザ保存優先)
        const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
        const trophies = stored ? JSON.parse(stored) : [];
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

    try {
        // ローカルストレージから読み込み
        const current = await getAcquiredTrophies();

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

/**
 * トロフィーデータをリセットする（デバッグ用）
 */
export function resetTrophies() {
    console.warn("Reset trophies not implemented for DB yet");
}
