
// 実験結果表示シーン
// 実験のスコア、レポート、フィードバックを表示します。
import template from './ResultScene.template.html?raw';

export function ResultScene(navigateTo, params) {
  const container = document.createElement('div');
  container.className = 'scene-container result-scene';
  container.innerHTML = template;

  const retryBtn = container.querySelector('#result-retry-btn');
  retryBtn.onclick = () => {
    if (navigateTo) navigateTo('lab', { experimentId: params?.experimentId });
  };

  const homeBtn = container.querySelector('#result-home-btn');
  homeBtn.onclick = () => {
    if (navigateTo) navigateTo('dashboard');
  };

  return container;
}
