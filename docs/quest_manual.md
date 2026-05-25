# VCL クエスト追加マニュアル

このマニュアルは、Node.js やバックエンドを触らずに実験クエストを追加・編集するための説明書です。

基本的に編集するファイルは次の1つです。

```txt
frontend/src/data/quests.js
```

## ID の付け方

実験 ID は、内容名を付けずに番号だけで統一します。

| 種類 | 形式 | 例 |
| --- | --- | --- |
| 実験 ID | `exp_番号` | `exp_01` |
| トロフィー ID | `trophy_exp_番号` | `trophy_exp_01` |

番号は、要件定義書の実験一覧と合わせます。実験名を変えても ID が変わらないため、画面遷移やトロフィーの対応を管理しやすくなります。

| ID | 実験名 |
| --- | --- |
| `exp_01` | 酸素の発生実験 |
| `exp_02` | 二酸化炭素の発生実験 |
| `exp_03` | 金属の溶け方（アルミニウム） |
| `exp_04` | 石灰水と二酸化炭素の反応 |
| `exp_05` | 硝酸銀水溶液の反応 |

## 1. 今できること

現在のクエスト定義では、薬品を入れて振って混ぜるタイプの実験をデータだけで作れます。

- フラスコに最初から固体や液体を入れておく。
- 下部ツールバーに薬品投入ボタンを出す。
- Joy-Con で試験管を傾けて薬品を注ぐ。
- Joy-Con でフラスコを振って混ぜる。
- 混合進行度に応じて色を変える。
- 泡を出す。
- 沈殿を出す。
- 固体を徐々に消す、溶かす。
- 成功時に解説と反応式を表示する。
- トロフィーを付与する。

加熱、燃焼、炎色反応、蒸発のように、熱源や炎の操作が必要な実験は一旦対象外です。これらを実装する場合は、混合とは別に「加熱する」「燃やす」「炎を表示する」操作とエフェクトを追加する必要があります。

## 2. 初期状態の指定

`scene` の中に書きます。

```js
scene: {
    flaskSolid: 'limestone',
    initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
}
```

### 2.1 `flaskSolid`

フラスコに最初から入れる固体を指定します。

| 値 | 表示内容 | 用途例 |
| --- | --- | --- |
| `'manganeseOxide'` | 黒い粉末 | 二酸化マンガン |
| `'limestone'` | 白い石の粒 | 石灰石 |
| `'aluminum'` | 銀色の金属片 | アルミニウム |

指定しない場合、固体は入りません。

### 2.2 `precipitate`

沈殿用の白い粒子を用意するかどうかを指定します。

```js
scene: {
    precipitate: true
}
```

| 値 | 内容 |
| --- | --- |
| `true` | 沈殿エフェクト用の粒子を準備する |
| 未指定 | 沈殿粒子を準備しない |

硝酸銀水溶液の反応のように、白い沈殿を出したい実験で使います。

### 2.3 `initialLiquid`

フラスコ内の液体の初期状態を指定します。

```js
initialLiquid: {
    visible: true,
    scaleY: 0.5,
    color: 0xddeeff,
    opacity: 0.3
}
```

| 項目 | 型 | 内容 |
| --- | --- | --- |
| `visible` | boolean | 最初から液体を見せるか |
| `scaleY` | number | 液体の量。`0.01` はほぼ空、`0.5` は半分程度、`1.0` は多め |
| `color` | number | 液体の色。`0xffffff` のような16進数 |
| `opacity` | number | 透明度。`0` が透明、`1` が不透明 |

## 3. 反応条件の指定

`reaction` の中に書きます。

```js
reaction: {
    reactant: {
        acceptedNames: ['塩酸', 'HCl']
    },
    requiresReactantBeforeMix: true,
    completeAt: 300,
    effects: {
        liquidColor: 0xffffff,
        bubbles: true
    }
}
```

### 3.1 `acceptedNames`

反応に必要な投入物の名前です。ここに書いた文字が、投入した薬品名に含まれていれば反応対象になります。

```js
acceptedNames: ['塩酸', 'HCl', 'HCL']
```

表記ゆれを吸収するため、複数書いておくのがおすすめです。

### 3.2 `requiresReactantBeforeMix`

薬品を注ぐ前にフラスコを振っても反応を進めないようにする設定です。

| 値 | 内容 |
| --- | --- |
| `true` | 指定した薬品が入るまで混合進行度を進めない |
| `false` または未指定 | 最初から振ると混合進行度が進む |

沈殿反応や石灰水反応のように、「薬品を入れてから反応開始」にしたい場合は `true` にします。

### 3.3 `completeAt`

成功判定に必要な混合進行度です。

```js
completeAt: 300
```

目安:

| 値 | 難しさ |
| --- | --- |
| `150` | すぐ終わる |
| `220` | やや短め |
| `300` | 標準 |
| `400` | 長め |

## 4. エフェクトの種類

現在対応しているエフェクトは5種類です。

### 4.1 `liquidColor`

混ぜたときにフラスコ内の液体の色を変えます。

```js
effects: {
    liquidColor: 0xffffff
}
```

例:

| 色 | 値 |
| --- | --- |
| 白 | `0xffffff` |
| 黒っぽい | `0x222222` |
| 灰色 | `0xaaaaaa` |
| 薄い水色 | `0xddeeff` |
| 白濁 | `0xeeeeee` |

### 4.2 `bubbles`

泡を出すかどうかを指定します。

```js
effects: {
    bubbles: true
}
```

| 値 | 内容 |
| --- | --- |
| `true` | 混ぜると泡が出る |
| `false` | 泡を出さない |
| 未指定 | 泡が出る扱い |

### 4.3 `precipitate`

白い沈殿を出します。

```js
scene: {
    precipitate: true
},
reaction: {
    effects: {
        precipitate: true,
        liquidColor: 0xeeeeee,
        bubbles: false
    }
}
```

注意: `effects.precipitate: true` だけでなく、`scene.precipitate: true` も必要です。

### 4.4 `fadeSolid`

粉末を徐々に薄くして消します。

```js
effects: {
    fadeSolid: 'manganeseOxide'
}
```

現在対応している値:

| 値 | 内容 |
| --- | --- |
| `'manganeseOxide'` | 二酸化マンガンの黒い粉末を薄くする |

### 4.5 `dissolveSolid`

固体を徐々に小さくして溶けるように見せます。

```js
effects: {
    dissolveSolid: 'limestone',
    dissolveStartAt: 100
}
```

現在対応している値:

| 値 | 内容 |
| --- | --- |
| `'limestone'` | 石灰石を徐々に小さくする |
| `'aluminum'` | アルミ片を徐々に小さくし、振動させる |

`dissolveStartAt` は、混合進行度がいくつを超えたら溶け始めるかです。

## 5. ツールバーの薬品ボタン

`toolbarActions` に書くと、実験画面の下にボタンが出ます。

```js
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
]
```

| 項目 | 内容 |
| --- | --- |
| `label` | ボタンに表示する名前 |
| `setTitle` | ボタンを押した後、画面タイトルに表示する名前 |
| `chemical.Name` | 反応判定に使う名前 |
| `chemical.EnglishName` | 英語名 |
| `chemical.Symbol` | 化学式 |
| `chemical.Appearance` | 見た目。液体判定や色判定に使われる |

## 6. 基本テンプレート

新しいクエストを作るときは、この形をコピーして使います。

```js
{
    id: 'exp_XX',
    title: '実験名',
    desc: 'セレクト画面に出る説明文。',
    materials: '使用物質A, 使用物質B',
    available: true,
    visual: {
        gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
    },
    mission: '実験画面に出る指示文。',
    scene: {
        flaskSolid: 'limestone',
        initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
    },
    toolbarActions: [
        {
            label: '投入する薬品名',
            setTitle: '投入する薬品名',
            chemical: {
                Name: '投入する薬品名',
                EnglishName: 'English Name',
                Symbol: 'Formula',
                Appearance: '無色透明液体'
            }
        }
    ],
    reaction: {
        reactant: {
            acceptedNames: ['投入する薬品名', 'Formula']
        },
        requiresReactantBeforeMix: true,
        completeAt: 300,
        effects: {
            liquidColor: 0xffffff,
            bubbles: true,
            dissolveSolid: 'limestone',
            dissolveStartAt: 100
        }
    },
    trophyId: 'trophy_exp_XX',
    explanationHtml: `
        <strong>物質A</strong>に<strong>物質B</strong>を加えると、反応が起こります。<br><br>
        学べることを書きます。<br><br>
        化学反応式：<br>
        <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">反応式を書く</span>
    `
}
```

## 7. よく使う組み合わせ

### 泡が出る実験

```js
scene: {
    flaskSolid: 'limestone',
    initialLiquid: { visible: false, scaleY: 0.01, color: 0xddeeff, opacity: 0.5 }
},
reaction: {
    reactant: { acceptedNames: ['塩酸', 'HCl'] },
    completeAt: 300,
    effects: {
        liquidColor: 0xffffff,
        bubbles: true,
        dissolveSolid: 'limestone',
        dissolveStartAt: 100
    }
}
```

### 沈殿が出る実験

```js
scene: {
    precipitate: true,
    initialLiquid: { visible: true, scaleY: 0.5, color: 0xddeeff, opacity: 0.3 }
},
reaction: {
    reactant: { acceptedNames: ['食塩水', 'NaCl'] },
    requiresReactantBeforeMix: true,
    completeAt: 300,
    effects: {
        liquidColor: 0xeeeeee,
        bubbles: false,
        precipitate: true
    }
}
```

### 色だけ変わる実験

```js
scene: {
    initialLiquid: { visible: true, scaleY: 0.4, color: 0xddeeff, opacity: 0.4 }
},
reaction: {
    reactant: { acceptedNames: ['二酸化炭素', 'CO2'] },
    requiresReactantBeforeMix: true,
    completeAt: 220,
    effects: {
        liquidColor: 0xffffff,
        bubbles: false
    }
}
```

## 8. 注意点

- `id` は `exp_01` のように番号だけで付け、他のクエストと被らないようにする。
- `trophyId` は `trophy_exp_01` のように、実験 ID と同じ番号を使う。
- 実験をまだ出したくない場合は `available: false` にする。
- 反応が始まらないときは、`acceptedNames` と `chemical.Name` が合っているか確認する。
- 沈殿を出したい場合は、`scene.precipitate: true` と `effects.precipitate: true` の両方が必要。
- 新しい固体や新しいエフェクトを増やす場合は、`LabScene.js` 側の実装追加が必要。
