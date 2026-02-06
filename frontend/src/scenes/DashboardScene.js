
// 実験を選択するダッシュボード（ホーム）シーン
// ユーザーはこの画面から行いたい実験を選びます。

export function DashboardScene(navigateTo) {
  const container = document.createElement('div');
  container.className = 'scene-container dashboard-scene';

  // ヘッダー
  const header = document.createElement('header');
  header.className = 'scene-header';
  const title = document.createElement('h1');
  title.textContent = '実験室へようこそ';
  const subtitle = document.createElement('p');
  subtitle.textContent = '本日の実験を選んでください';
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // 実験リストコンテナ
  const grid = document.createElement('div');
  grid.className = 'experiment-grid';

  // サンプル実験データ
  const experiments = [
    {
      id: 'exp01',
      title: '炎色反応の観察',
      description: '金属イオンによる炎の色の変化を観察しよう。',
      difficulty: '★☆☆',
      image: 'flame-test' // クラス名用
    },
    {
      id: 'exp02',
      title: '中和滴定',
      description: '酸と塩基が反応して水と塩ができる様子を学ぼう。',
      difficulty: '★★☆',
      image: 'titration'
    },
    {
      id: 'exp03',
      title: '気体の発生',
      description: '化学反応によって酸素や二酸化炭素を発生させよう。',
      difficulty: '★★☆',
      image: 'gas-generation'
    }
  ];

  // 実験カードの生成
  experiments.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'experiment-card';

    // 画像エリア（プレースホルダー）
    const imgArea = document.createElement('div');
    imgArea.className = `card-image ${exp.image}`;
    imgArea.textContent = 'Experiment Image'; // 仮
    card.appendChild(imgArea);

    // テキストエリア
    const content = document.createElement('div');
    content.className = 'card-content';

    const expTitle = document.createElement('h3');
    expTitle.textContent = exp.title;
    content.appendChild(expTitle);

    const expDesc = document.createElement('p');
    expDesc.textContent = exp.description;
    content.appendChild(expDesc);

    const diff = document.createElement('div');
    diff.className = 'difficulty-badge';
    diff.textContent = `難易度: ${exp.difficulty}`;
    content.appendChild(diff);

    // 開始ボタン
    const btn = document.createElement('button');
    btn.className = 'start-btn';
    btn.textContent = '実験を始める';
    btn.onclick = () => {
      // コールバック経由で画面遷移
      if (navigateTo) navigateTo('lab', { experimentId: exp.id });
    };
    content.appendChild(btn);

    card.appendChild(content);
    grid.appendChild(card);
  });

  container.appendChild(grid);

  return container;
}
