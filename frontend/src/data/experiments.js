export const experimentsData = [
    // 混ぜる等の実験（現在可能）
    { id: 'exp_01_o2', title: '酸素の発生実験', desc: '二酸化マンガンに過酸化水素水を注ぎ、激しく泡が出る様子を観察する。', materials: '二酸化マンガン, 過酸化水素水', available: true },
    { id: 'exp_02_co2', title: '二酸化炭素の発生実験', desc: '石灰石に塩酸を注ぎ、白く濁る様子や温度変化を観察する。', materials: '塩酸, 石灰石', available: true },
    { id: 'exp_03_al', title: '金属の溶け方（アルミニウム）', desc: 'アルミニウムに塩酸を注ぎ、発熱と水素発生を観察する。', materials: 'アルミニウム, 塩酸', available: true },
    { id: 'exp_06_neutral', title: '酸とアルカリの性質調べ', desc: '水酸化ナトリウムと塩酸の中和反応をフェノールフタレインで確認。', materials: 'NaOH, HCl', available: true },
    { id: 'exp_07_lime', title: '石灰水と二酸化炭素の反応', desc: '二酸化炭素に石灰水を入れて白く濁る（炭酸カルシウム生成）様子を見る。', materials: '石灰水, CO2', available: true },
    { id: 'exp_09_ag', title: '硝酸銀水溶液の反応', desc: '硝酸銀と塩化ナトリウムを混ぜ、塩化銀の白い沈殿を生成する。', materials: '硝酸銀, NaCl', available: true },

    // 加熱が必要な実験（Coming Soon）
    { id: 'exp_04_salt', title: '食塩水の蒸発 (Coming Soon)', desc: '食塩水を蒸発皿で加熱し、白い結晶（塩化ナトリウム）を取り出す。', materials: '食塩水', available: false },
    { id: 'exp_05_nahco3', title: '炭酸水素ナトリウムの加熱 (Coming Soon)', desc: '熱分解により炭酸ナトリウム、水、二酸化炭素が発生する様子を確認。', materials: '炭酸水素ナトリウム', available: false },
    { id: 'exp_08_mg', title: 'マグネシウムの燃焼 (Coming Soon)', desc: 'マグネシウムを燃焼させ、激しい光と酸化マグネシウムの生成を観察。', materials: 'Mg, O2', available: false },
    { id: 'exp_10_cu', title: '酸化銅の還元 (Coming Soon)', desc: '酸化銅と炭素を加熱し、銅が還元される様子を観察する。', materials: '酸化銅, 炭素', available: false },
    { id: 'exp_11_fe_s', title: '鉄と硫黄の反応 (Coming Soon)', desc: '鉄と硫黄を加熱して硫化鉄を生成。硫化鉄の生成を確認する。', materials: '鉄, 硫黄', available: false },
    { id: 'exp_12_flame', title: '炎色反応 (Coming Soon)', desc: 'リチウムや銅などの金属イオンが炎の中で特有の色を示す様子を観察する。', materials: 'リチウム, 銅, ナトリウム', available: false },
];
