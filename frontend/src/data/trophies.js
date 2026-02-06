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

    // 1. 実験スキル・テクニック系
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

    // 2. 探究・フリーモード系
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

    // 3. ソーシャル・アクティビティ系
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
