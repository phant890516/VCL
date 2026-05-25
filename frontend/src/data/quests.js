// クエスト追加・編集は基本的にこのファイルだけで行う。
// title/desc/materials はセレクト画面、mission/toolbarActions は実験画面、
// scene/reaction は3D初期状態と共通反応エフェクトに使われる。
// 対応済みエフェクト: liquidColor, bubbles, precipitate, fadeSolid, dissolveSolid。

// id は exp_01 のように番号だけで統一する。対応表は docs/quest_manual.md に記載。
export const quests = [
    {
        id: 'exp_01',
        title: '酸素の発生実験',
        desc: '二酸化マンガンに過酸化水素水を注ぎ、激しく泡が出る様子を観察する。',
        materials: '二酸化マンガン, 過酸化水素水',
        available: true,
        visual: {
            gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
        },
        mission: '下の「過酸化水素水」ボタンを押して、フラスコ（二酸化マンガン）に注ごう。',
        scene: {
            flaskSolid: 'manganeseOxide',
            initialLiquid: { visible: false, scaleY: 0.01, color: 0xaaccff, opacity: 0.5 }
        },
        toolbarActions: [
            {
                label: '過酸化水素水',
                setTitle: '過酸化水素水',
                chemical: {
                    Name: '過酸化水素水',
                    EnglishName: 'Hydrogen Peroxide',
                    Symbol: 'H2O2',
                    Appearance: '無色透明液体'
                }
            }
        ],
        reaction: {
            reactant: {
                acceptedNames: ['過酸化水素', 'H2O2', 'H₂O₂']
            },
            completeAt: 300,
            effects: {
                liquidColor: 0x222222,
                bubbles: true,
                fadeSolid: 'manganeseOxide'
            }
        },
        trophyId: 'trophy_exp_01',
        explanationHtml: `
            <strong>二酸化マンガン</strong>に<strong>過酸化水素水</strong>を加えると、<strong>酸素</strong>が発生します。<br><br>
            二酸化マンガンは自分自身は変化せず、過酸化水素水の分解を助ける<strong>触媒</strong>として働きます。<br><br>
            化学反応式：<br>
            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">2H₂O₂ → 2H₂O + O₂</span>
        `
    },
    {
        id: 'exp_02',
        title: '二酸化炭素の発生実験',
        desc: '石灰石に塩酸を注ぎ、白く濁る様子や温度変化を観察する。',
        materials: '塩酸, 石灰石',
        available: true,
        visual: {
            gradient: 'linear-gradient(135deg, #d7d2cc 0%, #304352 100%)'
        },
        mission: '下の「塩酸」ボタンを押して、フラスコ（石灰石）に注ぎ、よく振って反応させよう。',
        scene: {
            flaskSolid: 'limestone',
            initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
        },
        toolbarActions: [
            {
                label: '塩酸',
                setTitle: '塩酸',
                chemical: {
                    Name: '塩酸',
                    EnglishName: 'Hydrochloric Acid',
                    Symbol: 'HCl',
                    Appearance: '無色透明液体'
                }
            }
        ],
        reaction: {
            reactant: {
                acceptedNames: ['塩酸', '塩化水素', 'HCl', 'HCL']
            },
            completeAt: 300,
            effects: {
                liquidColor: 0xffffff,
                bubbles: true,
                dissolveSolid: 'limestone',
                dissolveStartAt: 100
            }
        },
        trophyId: 'trophy_exp_02',
        explanationHtml: `
            <strong>石灰石</strong>（炭酸カルシウム）に<strong>塩酸</strong>を加えると、<strong>二酸化炭素</strong>が発生します。<br><br>
            二酸化炭素は泡として出てきます。反応が進むにつれて、石灰石は徐々に溶けていきます。<br><br>
            化学反応式：<br>
            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂</span>
        `
    },
    {
        id: 'exp_03',
        title: '金属の溶け方（アルミニウム）',
        desc: 'アルミニウムに塩酸を注ぎ、発熱と水素発生を観察する。',
        materials: 'アルミニウム, 塩酸',
        available: true,
        visual: {
            gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)'
        },
        mission: '下の「塩酸」ボタンを押して、フラスコ（アルミニウム）に注ぎ、反応を観察しよう。',
        scene: {
            flaskSolid: 'aluminum',
            initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
        },
        toolbarActions: [
            {
                label: '塩酸',
                setTitle: '塩酸',
                chemical: {
                    Name: '塩酸',
                    EnglishName: 'Hydrochloric Acid',
                    Symbol: 'HCl',
                    Appearance: '無色透明液体'
                }
            }
        ],
        reaction: {
            reactant: {
                acceptedNames: ['塩酸', '塩化水素', 'HCl', 'HCL']
            },
            completeAt: 300,
            effects: {
                liquidColor: 0xaaaaaa,
                bubbles: true,
                dissolveSolid: 'aluminum',
                dissolveStartAt: 30
            }
        },
        trophyId: 'trophy_exp_03',
        explanationHtml: `
            <strong>アルミニウム</strong>に<strong>塩酸</strong>を加えると、反応して水素が発生し、<strong>塩化アルミニウム</strong>が生成されます。<br><br>
            実験操作では、混ぜることで反応が進行し、アルミニウム片が溶けていく様子を観察できます。<br><br>
            化学反応式：<br>
            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">2Al + 6HCl → 2AlCl₃ + 3H₂</span>
        `
    },
    {
        id: 'exp_04',
        title: '石灰水と二酸化炭素の反応',
        desc: '二酸化炭素に石灰水を入れて白く濁る（炭酸カルシウム生成）様子を見る。',
        materials: '石灰水, CO2',
        available: true,
        visual: {
            gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
        },
        mission: '下の「二酸化炭素」ボタンを押して、フラスコ（石灰水）に注ぎ、白濁を観察しよう。',
        scene: {
            initialLiquid: { visible: true, scaleY: 0.35, color: 0xddeeff, opacity: 0.35 }
        },
        toolbarActions: [
            {
                label: '二酸化炭素',
                setTitle: '二酸化炭素',
                chemical: {
                    Name: '二酸化炭素',
                    EnglishName: 'Carbon Dioxide',
                    Symbol: 'CO2',
                    Appearance: '無色の気体'
                }
            }
        ],
        reaction: {
            reactant: {
                acceptedNames: ['二酸化炭素', 'CO2', 'CO₂']
            },
            requiresReactantBeforeMix: true,
            completeAt: 220,
            effects: {
                liquidColor: 0xffffff,
                bubbles: false
            }
        },
        trophyId: 'trophy_exp_04',
        explanationHtml: `
            <strong>石灰水</strong>に<strong>二酸化炭素</strong>を通すと、水に溶けにくい<strong>炭酸カルシウム</strong>ができ、白く濁ります。<br><br>
            二酸化炭素の確認に使われる代表的な反応です。<br><br>
            化学反応式：<br>
            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O</span>
        `
    },
    {
        id: 'exp_05',
        title: '硝酸銀水溶液の反応',
        desc: '硝酸銀と塩化ナトリウムを混ぜ、塩化銀の白い沈殿を生成する。',
        materials: '硝酸銀, NaCl',
        available: true,
        visual: {
            gradient: 'linear-gradient(135deg, #c33764 0%, #1d2671 100%)'
        },
        mission: '下の「食塩水」ボタンを押して、フラスコ（硝酸銀水溶液）に注ぎ、変化を観察しよう。',
        scene: {
            precipitate: true,
            initialLiquid: { visible: true, scaleY: 0.5, color: 0xddeeff, opacity: 0.3 }
        },
        toolbarActions: [
            {
                label: '食塩水',
                setTitle: '食塩水',
                chemical: {
                    Name: '食塩水',
                    EnglishName: 'Sodium Chloride Solution',
                    Symbol: 'NaCl',
                    Appearance: '無色透明液体'
                }
            }
        ],
        reaction: {
            reactant: {
                acceptedNames: ['食塩', '食塩水', '塩化ナトリウム', 'NaCl']
            },
            requiresReactantBeforeMix: true,
            completeAt: 300,
            effects: {
                liquidColor: 0xeeeeee,
                bubbles: false,
                precipitate: true
            }
        },
        trophyId: 'trophy_exp_05',
        explanationHtml: `
            <strong>硝酸銀水溶液</strong>に<strong>食塩水（塩化ナトリウム）</strong>を加えると、水に溶けにくい<strong>塩化銀</strong>が生成され、白く沈殿します。<br><br>
            2種類の水溶液を混ぜて沈殿ができる反応を<strong>沈殿生成反応</strong>といいます。<br><br>
            化学反応式：<br>
            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">AgNO₃ + NaCl → AgCl↓ + NaNO₃</span>
        `
    }
];

export function getQuestById(id) {
    return quests.find(quest => quest.id === id) || null;
}

export function questToExperimentData(quest) {
    return {
        id: quest.id,
        title: quest.title,
        desc: quest.desc,
        materials: quest.materials,
        available: quest.available
    };
}

export function matchesQuestReactant(quest, chemicalName) {
    if (!quest || !quest.reaction || !chemicalName) return false;

    const normalizedName = chemicalName.toLowerCase();
    const acceptedNames = quest.reaction.reactant?.acceptedNames || [];

    return acceptedNames.some(name => {
        const normalizedAccepted = String(name).toLowerCase();
        return normalizedName.includes(normalizedAccepted) || normalizedName === normalizedAccepted;
    });
}
