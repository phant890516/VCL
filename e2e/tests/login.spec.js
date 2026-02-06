import { expect, test } from '@playwright/test';

test.describe('ユーザー登録フロー', () => {

  test.beforeEach(async ({ page }) => {
    // フロントエンドの開発サーバーにアクセス
    await page.goto('http://localhost:5173');
  });

  test('新規登録画面が正しく表示され、入力ができる', async ({ page }) => {
    // 1. タイトルの確認
    await expect(page.getByText('新規登録')).toBeVisible();

    // 2. フォームへの入力テスト
    await page.getByPlaceholder('ユーザー名').fill('VCL太朗');
    await page.getByPlaceholder('メールアドレス').fill('taro@example.com');
    await page.getByPlaceholder('パスワード').fill('Secret123!');

    // 3. アカウント作成ボタンの確認
    const submitButton = page.getByRole('button', { name: 'アカウントを作成' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
  });

  test('3秒後に自動的にホーム画面に遷移する（シミュレーション）', async ({ page }) => {
    // 最初は新規登録画面
    await expect(page.getByText('新規登録')).toBeVisible();

    // 3秒待つ（実際のアプリの挙動に合わせて）
    // ※本来はwaitForTimeoutは非推奨だが、今回のsetTimeoutデモに合わせる
    await page.waitForTimeout(3500);

    // サイドバーが出現しているか確認（VIRTUAL CHEMISTRY LABという文字があるか）
    await expect(page.getByText('VIRTUAL CHEMISTRY LAB')).toBeVisible();

    // ホーム画面のテキストが出ているか
    await expect(page.getByText('ホーム画面（仮）')).toBeVisible();
  });
});
