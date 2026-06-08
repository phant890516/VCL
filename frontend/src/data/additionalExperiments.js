/**
 * ファイル名: frontend/src/data/additionalExperiments.js
 * 概要: 追加実験4種（クエスト1〜4）の定義・成功/失敗条件・クリア演出データ
 * 役割:
 *   - ヨウ素デンプン反応、炭酸カルシウムの沈殿生成、BTB溶液のpH変色、塩化アンモニウム＋
 *     水酸化バリウムの吸熱反応 の4実験のメタデータを提供
 *   - 既存 experiments.js / trophies.js / chemicalMapping.js には変更を加えない
 *   - 各クエストの成功条件・失敗条件・安全性メモ・クリア演出を一元管理
 *
 * 使い方:
 *   import { additionalExperiments, additionalExperimentConditions, additionalTrophies }
 *     from './additionalExperiments.js';
 *   // 既存の experimentsData と結合する例:
 *   //   const allExperiments = [...experimentsData, ...additionalExperiments];
 *   //   const allTrophies    = [...trophiesData,    ...additionalTrophies];
 */

// =============================================================================
// 1. 追加実験4種の基本メタデータ
//    （既存 experiments.js の { id, title, desc, materials, available } 構造を踏襲）
// =============================================================================
export const additionalExperiments = [
    {
        id: 'exp_q1_iodine_starch',
        title: 'クエスト1：食べ物の秘密を暴け',
        desc: 'デンプン液にヨウ素液を滴下し、青紫色への即変色でデンプンの有無を判定する。'
            + '食品サンプル3種を順に検査し、デンプン探知マスターを目指す。',
        materials: 'デンプン液, ヨウ素液',
        category: 'color_reaction',
        icon: '🔬',
        available: false,
        comingSoon: true
    },
    {
        id: 'exp_q2_caco3_precipitation',
        title: 'クエスト2：透明から白を召喚せよ',
        desc: '透明な炭酸ナトリウム水溶液と塩化カルシウム水溶液を混ぜ、白い炭酸カルシウム沈殿を生成する。'
            + '上澄みが透明のまま残るのが理想の状態。',
        materials: '炭酸ナトリウム水溶液, 塩化カルシウム水溶液',
        category: 'precipitation',
        icon: '⚗️',
        available: false,
        comingSoon: true
    },
    {
        id: 'exp_q3_btb_phshift',
        title: 'クエスト3：三色を順番に操れ',
        desc: 'BTB溶液に酸性・アルカリ性水溶液を少量ずつ滴下し、黄→緑→青の3段階を1本の試験管内で順に再現する。'
            + '中間色の「緑」を捉えられるかが精密操作の鍵。',
        materials: 'BTB溶液, 酸性水溶液, アルカリ性水溶液',
        category: 'ph_indicator',
        icon: '🎨',
        available: false,
        comingSoon: true
    },
    {
        id: 'exp_q4_endothermic_winter',
        title: 'クエスト4：混ぜるだけで冬を作れ',
        desc: '塩化アンモニウム（固体）と水酸化バリウム水溶液を混合し、急激な吸熱と白煙発生を観察する。'
            + '混合直後に温度計が10℃以上低下すれば成功。',
        materials: '塩化アンモニウム, 水酸化バリウム水溶液',
        category: 'endothermic',
        icon: '❄️',
        available: false,
        comingSoon: true
    }
];

// =============================================================================
// 2. 成功条件 / 失敗条件 / クリア演出 / 安全注意のデータ
//    既存 experiments.js には条件フィールドが無いため、このモジュール内で定義する。
//    各 check は LabScene 側のセンサ/シミュレーション状態オブジェクトを引数に受け取る想定。
// =============================================================================
export const additionalExperimentConditions = {

    // -------------------------------------------------------------------------
    // クエスト1：食べ物の秘密を暴け（ヨウ素デンプン反応）
    // -------------------------------------------------------------------------
    'exp_q1_iodine_starch': {
        reaction: 'デンプン + I₂ → 青紫色錯体（呈色反応）',
        success: {
            description: '食品サンプル3種すべてでデンプンの有無を青紫変色で正しく判定できること',
            // state: { samplesJudged: number, correctJudgements: number, anyOverdosed: boolean }
            check: (state) => {
                if (!state) return false;
                return state.samplesJudged === 3
                    && state.correctJudgements === 3
                    && state.anyOverdosed !== true;
            }
        },
        failure: {
            description: 'ヨウ素液を入れすぎて全サンプルが茶色に染まり判定不能になる',
            // state: { iodineDropCount: number, allBrownStained: boolean }
            check: (state) => {
                if (!state) return false;
                if (state.allBrownStained === true) return true;
                if (state.iodineDropCount > 10) return true; // 入れすぎ閾値
                return false;
            }
        },
        clearEffect: {
            sound: 'detect_chime',
            message: 'デンプン探知機発動！食の真実を見抜いた！',
            visual: 'test_tube_glow_violet'      // 試験管が青紫に輝く鑑定バナー
        },
        safety: {
            level: 'low',
            note: '比較的安全・衣類付着注意（ヨウ素は色素染みになる）'
        },
        thermal: '温度変化なし'
    },

    // -------------------------------------------------------------------------
    // クエスト2：透明から白を召喚せよ（炭酸カルシウムの沈殿生成）
    // -------------------------------------------------------------------------
    'exp_q2_caco3_precipitation': {
        reaction: 'Na₂CO₃ + CaCl₂ → CaCO₃↓ + 2NaCl',
        success: {
            description: '透明な液体どうしを混ぜて白い沈殿が生成し、上澄みが透明のまま残ること',
            // state: { precipitateVolume, supernatantClarity, na2co3Volume, cacl2Volume }
            check: (state) => {
                if (!state) return false;
                return state.precipitateVolume >= 0.5       // 沈殿が観察可能な量
                    && state.supernatantClarity >= 0.85;    // 上澄みの透明度 0..1
            }
        },
        failure: {
            description: 'どちらかの液が少なすぎて沈殿がほとんど観察できない',
            check: (state) => {
                if (!state) return false;
                if (state.na2co3Volume < 0.2 || state.cacl2Volume < 0.2) return true;
                if (state.precipitateVolume < 0.1) return true;
                return false;
            }
        },
        clearEffect: {
            sound: 'summon_shimmer',
            message: '沈殿召喚！イオン結合の産物が現れた！',
            visual: 'beaker_glow_white'           // ビーカーが白く輝く錬成エフェクト
        },
        safety: {
            level: 'low',
            note: '廃液は中和処理・比較的安全'
        },
        thermal: '温度変化わずか'
    },

    // -------------------------------------------------------------------------
    // クエスト3：三色を順番に操れ（BTB溶液のpH変色）
    // -------------------------------------------------------------------------
    'exp_q3_btb_phshift': {
        reaction: 'BTB指示薬：黄(pH<6.0) → 緑(6.0〜7.6) → 青(pH>7.6)',
        success: {
            description: '黄→緑→青の3段階を1本の試験管の中で順番に再現できること',
            // state: { phHistory: number[], observedColors: Set<'yellow'|'green'|'blue'> }
            check: (state) => {
                if (!state) return false;
                const obs = state.observedColors;
                const has = (k) => (obs instanceof Set ? obs.has(k)
                    : Array.isArray(obs) ? obs.includes(k) : false);
                // 黄→緑→青 の順で観察したかを履歴順で確認
                if (!Array.isArray(state.phHistory)) return false;
                const seq = state.phHistory.map(p => {
                    if (p < 6.0) return 'yellow';
                    if (p <= 7.6) return 'green';
                    return 'blue';
                });
                const condensed = seq.filter((c, i) => i === 0 || c !== seq[i - 1]);
                const properOrder = condensed.join(',') === 'yellow,green,blue';
                return properOrder && has('yellow') && has('green') && has('blue');
            }
        },
        failure: {
            description: '一度に入れすぎて緑をスキップし黄から青へ直接飛ぶ',
            check: (state) => {
                if (!state || !Array.isArray(state.phHistory)) return false;
                const seq = state.phHistory.map(p => {
                    if (p < 6.0) return 'yellow';
                    if (p <= 7.6) return 'green';
                    return 'blue';
                });
                const condensed = seq.filter((c, i) => i === 0 || c !== seq[i - 1]);
                return condensed.join(',').includes('yellow,blue');
            }
        },
        clearEffect: {
            sound: 'rainbow_arpeggio',
            message: 'pH三色制覇！精密操作マスター！',
            visual: 'test_tube_rainbow_banner'    // 黄→緑→青と順に光る虹バナー
        },
        safety: {
            level: 'caution',
            note: '酸・アルカリの取り扱い注意（皮膚・眼への付着回避）'
        },
        thermal: '温度変化なし'
    },

    // -------------------------------------------------------------------------
    // クエスト4：混ぜるだけで冬を作れ（吸熱反応）
    // -------------------------------------------------------------------------
    'exp_q4_endothermic_winter': {
        reaction: '2NH₄Cl + Ba(OH)₂・8H₂O → BaCl₂ + 2NH₃↑ + 10H₂O（吸熱）',
        success: {
            description: '混合直後に温度計が10℃以上低下し白煙の発生を観察記録できること',
            // state: { tempDropDeg, whiteSmokeObserved, recorded }
            check: (state) => {
                if (!state) return false;
                return state.tempDropDeg >= 10
                    && state.whiteSmokeObserved === true
                    && state.recorded === true;
            }
        },
        failure: {
            description: '換気なしで白煙を吸い込む、または素手で容器を長時間保持する',
            // state: { ventilation, smokeInhaled, bareHandHoldSec }
            check: (state) => {
                if (!state) return false;
                if (state.ventilation === false && state.smokeInhaled === true) return true;
                if (state.bareHandHoldSec > 10) return true; // 凍傷リスク
                return false;
            }
        },
        clearEffect: {
            sound: 'freeze_chime',
            message: '吸熱魔法発動！熱を奪いし冬の錬金術師！',
            visual: 'screen_frost_overlay'        // 画面が氷結エフェクトで覆われる
        },
        safety: {
            level: 'danger',
            note: 'アンモニア吸引厳禁・換気必須（刺激臭・有毒）'
        },
        thermal: '急激な吸熱（-10℃以上低下）'
    }
};

// =============================================================================
// 3. 各実験に対応する追加トロフィー
//    （既存 trophiesData の構造 { id, title, description, category } に合わせる）
// =============================================================================
export const additionalTrophies = [
    {
        id: 'trophy_exp_q1_iodine_starch',
        title: 'デンプン探知マスター',
        description: '「ヨウ素デンプン反応」で食品3種のデンプン有無を完全に見抜いた',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_q2_caco3_precipitation',
        title: '沈殿召喚士',
        description: '「炭酸カルシウムの沈殿生成」で美しい白沈殿と透明な上澄みを得た',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_q3_btb_phshift',
        title: 'pH三色制覇',
        description: '「BTB溶液のpH変色」で黄→緑→青の3段階を一本の試験管で再現した',
        category: 'experiment'
    },
    {
        id: 'trophy_exp_q4_endothermic_winter',
        title: '冬の錬金術師',
        description: '「吸熱反応」で温度を10℃以上低下させ、白煙とともに冬を生み出した',
        category: 'experiment'
    }
];

// =============================================================================
// 4. ヘルパー: 実験IDから条件・トロフィーを取得するためのユーティリティ
// =============================================================================

/**
 * 実験IDから成功・失敗・演出データを引く
 * @param {string} experimentId 実験ID (例: 'exp_q1_iodine_starch')
 * @returns {object|null} 条件データ。存在しない場合は null
 */
export function getAdditionalConditions(experimentId) {
    return additionalExperimentConditions[experimentId] || null;
}

/**
 * 実験IDから対応する追加トロフィーを引く
 * @param {string} experimentId 実験ID
 * @returns {object|null} トロフィー定義。存在しない場合は null
 */
export function getAdditionalTrophyByExperimentId(experimentId) {
    const trophyId = `trophy_${experimentId}`;
    return additionalTrophies.find(t => t.id === trophyId) || null;
}

/**
 * 与えられたシミュレーション state を成功条件で評価する
 * 失敗判定を優先し、次に成功判定、どちらにも当てはまらなければ 'pending'
 * @param {string} experimentId
 * @param {object} state - LabScene 側で構築する状態オブジェクト
 * @returns {'success'|'failure'|'pending'}
 */
export function evaluateAdditionalExperiment(experimentId, state) {
    const cond = additionalExperimentConditions[experimentId];
    if (!cond) return 'pending';
    try {
        if (cond.failure && typeof cond.failure.check === 'function' && cond.failure.check(state)) {
            return 'failure';
        }
        if (cond.success && typeof cond.success.check === 'function' && cond.success.check(state)) {
            return 'success';
        }
    } catch (e) {
        console.warn('[additionalExperiments] check 関数の実行中にエラー:', e);
    }
    return 'pending';
}
