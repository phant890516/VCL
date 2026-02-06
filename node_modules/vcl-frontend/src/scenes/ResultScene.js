
// 実験結果表示シーン
// 実験のスコア、レポート、フィードバックを表示します。

export function ResultScene(navigateTo, params) {
  const container = document.createElement('div');
  container.className = 'scene-container result-scene';

  const card = document.createElement('div');
  card.className = 'result-card';

  // タイトル
  const title = document.createElement('h1');
  title.textContent = '実験完了！';
  card.appendChild(title);

  // 実験ID表示（本来は実験名などをDB/Configから引く）
  const subTitle = document.createElement('p');
  subTitle.textContent = `Experiment: ${params?.experimentId || '-'}`;
  card.appendChild(subTitle);

  // スコア表示セクション
  const scoreSection = document.createElement('div');
  scoreSection.className = 'score-section';

  const scoreLabel = document.createElement('span');
  scoreLabel.textContent = '総合評価';
  scoreSection.appendChild(scoreLabel);

  const scoreValue = document.createElement('div');
  scoreValue.className = 'score-value';
  scoreValue.textContent = 'A'; // 仮のスコア
  scoreSection.appendChild(scoreValue);

  card.appendChild(scoreSection);

  // フィードバックリスト
  const feedbackList = document.createElement('ul');
  feedbackList.className = 'feedback-list';

  const feedbacks = [
    '手順は正確でした。',
    '試薬の量をもう少し慎重に計りましょう。',
    '安全確認は完璧でした！'
  ];

  feedbacks.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    feedbackList.appendChild(li);
  });
  card.appendChild(feedbackList);

  // アクションボタンエリア
  const actionArea = document.createElement('div');
  actionArea.className = 'result-actions';

  const retryBtn = document.createElement('button');
  retryBtn.className = 'primary-btn';
  retryBtn.textContent = 'もう一度挑戦する';
  retryBtn.onclick = () => {
    if (navigateTo) navigateTo('lab', { experimentId: params?.experimentId });
  };

  const homeBtn = document.createElement('button');
  homeBtn.className = 'secondary-btn';
  homeBtn.textContent = 'ホームに戻る';
  homeBtn.onclick = () => {
    if (navigateTo) navigateTo('dashboard');
  };

  actionArea.appendChild(retryBtn);
  actionArea.appendChild(homeBtn);
  card.appendChild(actionArea);

  container.appendChild(card);
  return container;
}
