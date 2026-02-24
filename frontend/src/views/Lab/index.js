import '../../assets/periodicTable.css';
import { periodicData } from '../../data/periodicData.js';
import { periodicTableLayout } from '../../data/periodicTable.js';
import { LabScene } from '../../scenes/LabScene.js';
import './style.css';
import template from './template.html?raw';

export function LabView(navigateTo, params = {}) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // タイトル設定
    const titleEl = container.querySelector('#lab-title-display');
    if (titleEl) {
        titleEl.textContent = params.title || 'フリー実験';
    }

    // ---------------------------------------------------------
    // 状態管理変数
    // ---------------------------------------------------------
    let labScene = null;
    let intervalId = null;
    let seconds = 0;

    // 周期表関連
    let isPeriodicOpen = false;
    let currentFocusIndex = 0; // periodicTableLayout のインデックス
    let detailedData = periodicData;   // フロントエンドのデータを使用

    // Joy-Con入力制御用
    let lastStickMoveTime = 0;
    const STICK_DELAY = 150;      // スティック入力の反応間隔(ms)
    const STICK_THRESHOLD = 0.5;  // スティックの倒し込み閾値

    // ---------------------------------------------------------
    // DOM要素の取得
    // ---------------------------------------------------------
    const overlay = container.querySelector('#periodic-table-overlay');
    const tableEl = container.querySelector('#periodic-table-grid');
    const btnPeriodic = container.querySelector('#btn-lab-periodic-table');
    const btnClosePeriodic = container.querySelector('#btn-close-periodic');
    const btnFinish = container.querySelector('#btn-lab-finish');
    const timerEl = container.querySelector('#lab-timer');

    // 詳細情報パネル要素
    const infoNameJp = container.querySelector('#pt-info-name-jp');
    const infoNameEn = container.querySelector('#pt-info-name-en');
    const infoSymbol = container.querySelector('#pt-info-symbol');
    const infoNumber = container.querySelector('#pt-info-number');
    const infoWeight = container.querySelector('#pt-info-weight');
    const infoMp = container.querySelector('#pt-info-mp');
    const infoBp = container.querySelector('#pt-info-bp');
    const infoApp = container.querySelector('#pt-info-app');
    const infoDesc = container.querySelector('#pt-info-desc');

    // ---------------------------------------------------------
    // 関数定義 (周期表ロジック)
    // ---------------------------------------------------------

    // 1. データロード (API廃止 -> インポート済みデータ使用)
    async function loadPeriodicDetails() {
        // 既にimportされているので何もしない (将来的にAPIに戻す場合はここを復活)
        // detailedData = periodicData;
        console.log('Chemical details loaded from local source');
    }
    loadPeriodicDetails();

    // 2. 情報パネル更新
    function updateInfoPanel(layoutData) {
        if (!infoSymbol) return;

        infoSymbol.textContent = layoutData.symbol;
        infoNameJp.textContent = layoutData.name;
        infoNumber.textContent = layoutData.number;

        let detail = null;
        if (detailedData && Array.isArray(detailedData)) {
            // まず番号でマッチングを試みる (より確実)
            // backendのAtomicNumberとfrontendのnumberが一致するか？
            detail = detailedData.find(d => d.AtomicNumber === layoutData.number);

            // もし番号で見つからなければ、名前でマッチングを試みる (バックアップ)
            if (!detail) {
                detail = detailedData.find(d => d.Name === layoutData.name);
            }
        }

        // デバッグ用ログ: どういうデータが来ているか確認
        // console.log('Looking for:', layoutData.name, 'Found:', detail);

        if (detail) {
            // EnglishNameがあればそれを、なければSymbolを表示
            infoNameEn.textContent = detail.EnglishName || detail.Symbol || '-';
            infoWeight.textContent = detail.MolecularWeight || '-';
            infoMp.textContent = detail.MeltingPoint || '-';
            infoBp.textContent = detail.BoilingPoint || '-';
            infoApp.textContent = detail.Appearance || '-';
            // Descriptionがあればそれを、なければGHSがあればそれを
            infoDesc.textContent = detail.Description || detail.GHSClassification || '詳細情報なし';
        } else {
            infoNameEn.textContent = '-';
            infoWeight.textContent = '-';
            infoMp.textContent = '-';
            infoBp.textContent = '-';
            infoApp.textContent = '-';
            infoDesc.textContent = '詳細データが見つかりません';
        }
    }

    // 3. 周期表レンダリング
    function renderTable() {
        if (!tableEl) return;
        tableEl.innerHTML = '';

        // 7行18列のグリッド用配列を作成
        const rows = 7;
        const cols = 18;
        const grid = Array(rows).fill().map(() => Array(cols).fill(null));

        // データをグリッドにマッピング
        periodicTableLayout.forEach((el, idx) => {
            if (el.period >= 1 && el.period <= rows && el.group >= 1 && el.group <= cols) {
                grid[el.period - 1][el.group - 1] = { ...el, originalIndex: idx };
            }
        });

        // HTML生成
        for (let p = 0; p < rows; p++) {
            for (let g = 0; g < cols; g++) {
                const cell = document.createElement('div');
                const elData = grid[p][g];

                if (elData) {
                    cell.className = 'element-cell';
                    if (elData.originalIndex === currentFocusIndex) {
                        cell.classList.add('selected');
                        updateInfoPanel(elData);
                    }

                    cell.innerHTML = `
                        <div class="element-number">${elData.number}</div>
                        <div class="element-symbol">${elData.symbol}</div>
                        <div class="element-name">${elData.name}</div>
                    `;

                    // クリックイベント
                    cell.onclick = () => {
                        currentFocusIndex = elData.originalIndex;
                        // 選択して決定（周期表を閉じる & 実験に反映）
                        const selected = periodicTableLayout[currentFocusIndex];
                        console.log('Clicked Chemical:', selected);
                        if (titleEl) titleEl.textContent = selected.name;

                        if (labScene && labScene.setChemical) {
                            // detailedData から詳細情報を取得してマージ
                            let detail = null;
                            if (detailedData && Array.isArray(detailedData)) {
                                detail = detailedData.find(d => d.AtomicNumber === selected.number) || detailedData.find(d => d.Name === selected.name);
                            }
                            const fullData = detail ? { ...selected, ...detail } : selected;

                            labScene.setChemical(fullData);
                        }

                        closePeriodicTable();
                    };
                } else {
                    // 空白セル (不可視だがレイアウト維持のため配置)
                    cell.className = 'element-cell empty';
                    cell.style.visibility = 'hidden';
                }
                tableEl.appendChild(cell);
            }
        }
    }

    // 4. 開閉操作
    const handleEscKey = (e) => {
        console.log('Key pressed:', e.key);
        if (e.key === 'Escape') closePeriodicTable();
    };

    function openPeriodicTable() {
        if (!overlay) return;
        if (isPeriodicOpen) return;

        isPeriodicOpen = true;
        overlay.style.display = 'flex';
        renderTable();
        // LabSceneの入力を一時停止 (カメラ操作などをブロック)
        if (labScene) labScene.setInputEnabled(false);

        // windowではなくdocumentに登録してみる、かつcaptureフェーズで捕捉
        document.addEventListener('keydown', handleEscKey, true);
        console.log('Periodic table opened, Esc listener added');
    }

    function closePeriodicTable() {
        if (!overlay) return;
        isPeriodicOpen = false;
        overlay.style.display = 'none';
        // LabSceneの入力を再開
        if (labScene) labScene.setInputEnabled(true);

        document.removeEventListener('keydown', handleEscKey, true);
        console.log('Periodic table closed, Esc listener removed');
    }

    // 5. ナビゲーションロジック (上下左右移動)
    function handleInput(action) {
        if (!isPeriodicOpen) return;

        const currentEl = periodicTableLayout[currentFocusIndex];

        // 現在位置から指定方向(dPeriod, dGroup)に最も近い要素を探す
        const findNavTarget = (dPeriod, dGroup) => {
            let p = currentEl.period;
            let g = currentEl.group;

            let bestCandidate = null;
            let minDist = 9999;

            periodicTableLayout.forEach((cand, idx) => {
                if (idx === currentFocusIndex) return;

                const dp = cand.period - p;
                const dg = cand.group - g;

                let valid = false;
                // 方向判定
                if (dPeriod === -1) valid = (dp < 0 && Math.abs(dg) <= 1); // 上
                if (dPeriod === 1) valid = (dp > 0 && Math.abs(dg) <= 1); // 下
                if (dGroup === -1) valid = (dg < 0 && Math.abs(dp) <= 0); // 左
                if (dGroup === 1) valid = (dg > 0 && Math.abs(dp) <= 0); // 右

                if (valid) {
                    const dist = Math.abs(dp) + Math.abs(dg); // マンハッタン距離
                    if (dist < minDist) {
                        minDist = dist;
                        bestCandidate = idx;
                    }
                }
            });
            return bestCandidate;
        };

        let newIndex = null;
        if (action === 'up') newIndex = findNavTarget(-1, 0);
        if (action === 'down') newIndex = findNavTarget(1, 0);
        if (action === 'left') newIndex = findNavTarget(0, -1);
        if (action === 'right') newIndex = findNavTarget(0, 1);

        if (newIndex !== null) {
            currentFocusIndex = newIndex;
            renderTable();
        }

        if (action === 'close') {
            closePeriodicTable();
        }
    }

    // 6. Joy-Conイベントハンドラ (LabSceneから呼ばれる)
    function handleJoyConInput(data) {
        // data structure: { angle: number, raw: { buttons, sticks... } }
        const raw = data.raw;
        if (!raw) return;

        // 周期表が開いていない時はここで終了 (または開くボタンのチェック)
        if (!isPeriodicOpen) {
            // 例: Xボタンなどで開くならここでチェック
            // if (raw.buttons?.parsed?.right?.x) openPeriodicTable();

            // Joy-Conの角度を3Dシーンに反映させる必要がある
            // LabScene側でgyro-dataイベントをリッスンして処理しているが、
            // ここでLabViewがイベントをフックしてしまうと、LabScene側のデフォルト動作が阻害されていないか確認が必要。
            // しかし、LabScene.jsの実装を見ると、SocketIOからのイベントを直接受け取って内部状態を更新し、
            // その後 onGyroData コールバックを呼んでいるはず。

            // LabScene.js の実装を確認すると、onGyroData は単なる通知フック。
            // したがって、ここでreturnしてもLabScene内部の回転ロジックには影響しないはずだが、
            // ユーザーが「反映されなくなった」と言っている。

            // LabScene.jsを読んで確認したが、LabScene内で `this.socket.on('gyro-data', ...)` しており、
            // そこで `this.flask.rotation.z = ...` しているなら動くはず。
            // もしLabSceneがこのコールバックに依存しているなら問題。

            // 念のため、ここで明示的にLabSceneに渡す必要はないか？
            // いえ、LabSceneがイベント発生源です。

            return;
        }

        const now = Date.now();
        if (now - lastStickMoveTime < STICK_DELAY) return;

        let moved = false;

        // Sticks (Left or Right)
        // JoyConServiceからのデータ構造: raw.sticks.left.x/y など (-1.0 ~ 1.0)
        // Y軸は上がマイナス値になることが多いが、JoyConServiceの実装次第。
        // ここでは raw.sticks が存在することを前提に処理する。
        const sl = raw.sticks?.left || {x:0, y:0};
        const sr = raw.sticks?.right || {x:0, y:0};

        // デバッグログ (開発時のみ有効にすると便利)
        // console.log('Sticks:', sl, sr);

        // Y軸: 上がマイナス, 下がプラス (通常のアナログスティックの仕様)
        // X軸: 左がマイナス, 右がプラス
        // 右スティックも有効に
        if (sl.y < -STICK_THRESHOLD || sr.y < -STICK_THRESHOLD) { handleInput('up'); moved = true; }
        else if (sl.y > STICK_THRESHOLD || sr.y > STICK_THRESHOLD) { handleInput('down'); moved = true; }
        else if (sl.x < -STICK_THRESHOLD || sr.x < -STICK_THRESHOLD) { handleInput('left'); moved = true; }
        else if (sl.x > STICK_THRESHOLD || sr.x > STICK_THRESHOLD) { handleInput('right'); moved = true; }

        // 開発用: スティック値が閾値を超えてないか確認用ログ
        // if (!moved && (Math.abs(sr.x) > 0.1 || Math.abs(sr.y) > 0.1)) {
        //    console.log(`Right Stick raw: x=${sr.x}, y=${sr.y}`);
        // }

        // D-Pad (Left Joy-Con Buttons)
        if (!moved && raw.buttons?.parsed?.left) {
            if (raw.buttons.parsed.left.up) { handleInput('up'); moved = true; }
            if (raw.buttons.parsed.left.down) { handleInput('down'); moved = true; }
            if (raw.buttons.parsed.left.left) { handleInput('left'); moved = true; }
            if (raw.buttons.parsed.left.right) { handleInput('right'); moved = true; }
        }

        if (moved) lastStickMoveTime = now;

        // Buttons (Right Joy-Con)
        if (raw.buttons?.parsed?.right) {
            // A or B to Close/Select
            if (raw.buttons.parsed.right.b) closePeriodicTable();
            if (raw.buttons.parsed.right.a) {
                // 選択決定時の処理
                const selected = periodicTableLayout[currentFocusIndex];
                console.log('Selected Chemical:', selected);

                // タイトル更新
                if (titleEl) titleEl.textContent = selected.name;

                // LabScene側の中身を変更
                if (labScene && labScene.setChemical) {
                    // detailedData から詳細情報を取得してマージ
                    let detail = null;
                    if (detailedData && Array.isArray(detailedData)) {
                        detail = detailedData.find(d => d.AtomicNumber === selected.number) || detailedData.find(d => d.Name === selected.name);
                    }
                    const fullData = detail ? { ...selected, ...detail } : selected;

                    labScene.setChemical(fullData);
                }

                closePeriodicTable();
            }
        }
    }

    // ---------------------------------------------------------
    // イベントリスナー設定
    // ---------------------------------------------------------

    // 周期表ボタン
    if (btnPeriodic) {
        btnPeriodic.addEventListener('click', () => {
            if (isPeriodicOpen) closePeriodicTable();
            else openPeriodicTable();
        });
    }

    // 周期表閉じるボタン
    if (btnClosePeriodic) {
        btnClosePeriodic.addEventListener('click', closePeriodicTable);
    }

    // 実験終了ボタン
    if (btnFinish) {
        btnFinish.addEventListener('click', () => {
            clearInterval(intervalId);
            if (labScene) labScene.dispose();
            navigateTo('result', { score: 'S' });
        });
    }

    // タイマー処理
    if (timerEl) {
        intervalId = setInterval(() => {
            if (!document.body.contains(container)) {
                clearInterval(intervalId);

                // リスナー削除のため、開いていれば閉じる処理を実行
                if (isPeriodicOpen) closePeriodicTable();

                // DOM削除時に破棄も行う
                if (labScene) labScene.dispose();
                return;
            }
            seconds++;
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    // ---------------------------------------------------------
    // シーン初期化 (非同期)
    // ---------------------------------------------------------
    setTimeout(() => {
        const canvasContainer = container.querySelector('#three-canvas-container');
        if (canvasContainer) {
            // コンストラクタにパラメータを渡して初期化
            labScene = new LabScene(canvasContainer, params.id);

            // Joy-Conイベントをフック
            labScene.onGyroData = (data) => {
                // JoyConServiceからの生データがあれば使用してUI操作
                if (data.raw) {
                    handleJoyConInput(data);
                }
            };

            // 実験完了時のコールバック
            labScene.onExperimentComplete = (expId) => {
                const dialog = container.querySelector('#lab-explanation-dialog');
                const textEl = container.querySelector('#lab-explanation-text');
                const btnClose = container.querySelector('#btn-close-explanation');

                if (dialog && textEl) {
                    if (expId === 'exp_01_o2') {
                        textEl.innerHTML = `
                            <strong>二酸化マンガン</strong>に<strong>過酸化水素水</strong>を加えると、<strong>酸素</strong>が発生します。<br><br>
                            この反応において、二酸化マンガン自身は変化せず、過酸化水素が分解するのを助ける<strong>「触媒（しょくばい）」</strong>として働いています。<br><br>
                            化学反応式：<br>
                            <span style="font-family: monospace; font-size: 1.3rem; color: #ffeb3b;">2H₂O₂ → 2H₂O + O₂</span>
                        `;
                    }
                    dialog.style.display = 'block';

                    if (btnClose) {
                        btnClose.onclick = () => {
                            dialog.style.display = 'none';
                            // クエスト完了としてリザルト画面へ
                            clearInterval(intervalId);
                            if (labScene) labScene.dispose();
                            navigateTo('result', { score: 'S' });
                        };
                    }
                }
            };

            // 実験IDが渡されている場合、その実験用の初期設定を行う
            if (params.id) {
                console.log(`Setting up experiment: ${params.title} (${params.id})`);

                // クエスト手順の表示
                const instructionBox = container.querySelector('#lab-instruction-box');
                const instructionText = container.querySelector('#lab-instruction-text');
                if (instructionBox && instructionText) {
                    let mission = '';
                    switch (params.id) {
                        case 'exp_01_o2':
                            mission = '下の「過酸化水素水」ボタンを押して、フラスコ（二酸化マンガン）に注ごう。';
                            break;
                        case 'exp_02_co2':
                            mission = '周期表から「塩素(Cl)」を選んで、塩酸としてフラスコ（石灰石）に注ごう。';
                            break;
                        default:
                            mission = '自由に実験してみよう。';
                    }
                    if (mission) {
                        instructionText.textContent = mission;
                        instructionBox.style.display = 'block';
                    }
                }

                // ツールバー設定
                const toolbar = container.querySelector('#lab-toolbar');
                if (toolbar) {
                     // 1. まずツールバーをクリア (デフォルトの非表示ボタンなどを削除)
                     // ただし、実験ノートボタン等を残したい場合は注意が必要だが、今回はテンプレート側で削除済み
                     toolbar.innerHTML = '';

                     // 2. 実験IDに応じたボタンを追加
                     if (params.id === 'exp_01_o2') {
                         const btn = document.createElement('button');
                         btn.className = 'secondary-btn'; // スタイルクラスは既存のものを使用
                         btn.textContent = '過酸化水素水';
                         btn.style.width = 'auto';
                         btn.style.padding = '0.5rem 1rem';
                         btn.onclick = () => {
                             // 過酸化水素水のデータをセット
                             // LabSceneはName, Symbol, Appearanceなどを使う
                             const h2o2 = {
                                 Name: '過酸化水素水',
                                 EnglishName: 'Hydrogen Peroxide',
                                 Symbol: 'H₂O₂',
                                 Appearance: '無色透明液体',
                             };
                             if (labScene && labScene.setChemical) {
                                 labScene.setChemical(h2o2);
                                 if (titleEl) titleEl.textContent = '過酸化水素水';
                             }
                         };
                         toolbar.appendChild(btn);
                     }
                }


                // TODO: 実験ごとのセットアップロジックをここに書く
                // 例: 特定の薬品を初期状態でセットするなど

                // 今回は炎色反応(exp_12_flame)の場合の処理を追加
                if (params.id === 'exp_12_flame') {
                    // 炎色反応用の初期設定（例えば、リチウムをセット）
                    const initialChemical = detailedData.find(d => d.Name === 'リチウム' || d.Symbol === 'Li');
                    if (initialChemical && labScene.setChemical) {
                        labScene.setChemical(initialChemical);
                        if (titleEl) titleEl.textContent = `炎色反応: ${initialChemical.Name}`;
                    }
                }
            }
        }
    }, 0);

    return container;
}
