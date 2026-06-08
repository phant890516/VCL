
/**
 * ファイル名: frontend/src/scenes/DashboardScene.js
 * 概要: ダッシュボードシーン（非推奨/レガシーの可能性あり）
 * 役割:
 *   - ダッシュボード機能の提供（現在は views/Dashboard がメインの可能性）
 *   - 実験選択ロジックなど
 */
// 実験を選択するダッシュボード（ホーム）シーン
// ユーザーはこの画面から行いたい実験を選びます。
import template from './DashboardScene.template.html?raw';

export function DashboardScene(navigateTo) {
  const container = document.createElement('div');
  container.className = 'scene-container dashboard-scene';
  container.innerHTML = template;
  const grid = container.querySelector('#legacy-dashboard-experiment-grid');
  const cardTemplate = container.querySelector('#legacy-dashboard-card-template');

  // サンプル実験データ
  const experiments = [
    {
      id: 'exp01',
      title: '酸素の発生',
      description: '過酸化水素水と二酸化マンガンを混ぜ、泡として酸素が出る様子を観察しよう。',
      difficulty: '★☆☆',
      image: 'gas-generation' // クラス名用
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
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const imgArea = card.querySelector('.card-image');
    const btn = card.querySelector('.start-btn');

    imgArea.classList.add(exp.image);
    imgArea.textContent = 'Experiment Image'; // 仮
    card.querySelector('.experiment-title').textContent = exp.title;
    card.querySelector('.experiment-description').textContent = exp.description;
    card.querySelector('.difficulty-badge').textContent = `難易度: ${exp.difficulty}`;
    btn.onclick = () => {
      // コールバック経由で画面遷移
      if (navigateTo) navigateTo('lab', { experimentId: exp.id });
    };
    grid.appendChild(card);
  });

  return container;
}
