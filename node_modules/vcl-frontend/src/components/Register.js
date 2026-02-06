export function Register() {
  const container = document.createElement('div');
  container.className = 'main-content';

  const card = document.createElement('div');
  card.className = 'register-card';

  // タイトル
  const title = document.createElement('h2');
  title.className = 'register-title';
  title.textContent = '新規登録';
  card.appendChild(title);

  // フォーム作成関数
  const createInput = (placeholder, type = 'text') => {
    const group = document.createElement('div');
    group.className = 'input-group';
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.className = 'input-field';
    group.appendChild(input);
    return group;
  };

  card.appendChild(createInput('ユーザー名'));
  card.appendChild(createInput('メールアドレス', 'email'));
  card.appendChild(createInput('パスワード', 'password'));

  // 作成ボタン
  const button = document.createElement('button');
  button.className = 'submit-btn';
  button.textContent = 'アカウントを作成';
  card.appendChild(button);

  // ログインリンク
  const linkDiv = document.createElement('div');
  linkDiv.className = 'login-link';
  linkDiv.innerHTML = `アカウントをお持ちですか？ <a href="#">ログイン</a>`;
  card.appendChild(linkDiv);

  container.appendChild(card);
  return container;
}
