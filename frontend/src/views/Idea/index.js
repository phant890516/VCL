import './style.css';
import template from './template.html?raw';

export function IdeaView(navigateTo) {
    const container = document.createElement('div');
    container.classList.add('view-container');
    container.innerHTML = template;

    // ユーザー情報の取得
    let user = null;
    try {
        const userJson = localStorage.getItem('vcl_user');
        if (userJson) {
            user = JSON.parse(userJson);
        }
    } catch (e) {
        console.error('Failed to parse user data', e);
    }

    const bannerFree = container.querySelector('#banner-free-mode');
    if (bannerFree) {
        bannerFree.addEventListener('click', () => {
            navigateTo('/free-mode'); // または 'lab' with free params
        });
    }

    const textarea = container.querySelector('.idea-textarea');
    const saveBtn = container.querySelector('#save-note-btn');

    if (user && textarea && saveBtn) {
        // ノートの読み込み
        textarea.disabled = true;
        textarea.value = '読み込み中...';

        fetch(`http://localhost:3000/api/notes/${user.id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch note');
                }
                return res.json();
            })
            .then(data => {
                textarea.value = data.content || '';
                textarea.disabled = false;
            })
            .catch(err => {
                console.error(err);
                textarea.value = '';
                textarea.placeholder = 'メモの読み込みに失敗しました。';
                textarea.disabled = false;
            });

        // ノートの保存
        saveBtn.addEventListener('click', async () => {
             const content = textarea.value;
             const originalText = saveBtn.textContent;

             saveBtn.disabled = true;
             saveBtn.textContent = '保存中...';

             try {
                 const res = await fetch('http://localhost:3000/api/notes', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ userId: user.id, content })
                 });

                 if (!res.ok) {
                     throw new Error('Save failed');
                 }

                 alert('保存しました');
             } catch (err) {
                 console.error(err);
                 alert('保存に失敗しました');
             } finally {
                 saveBtn.disabled = false;
                 saveBtn.textContent = originalText;
             }
        });
    } else {
        // ログインしていない場合はローカルストレージを使用
        if (textarea) {
            const localNote = localStorage.getItem('vcl_idea_note');
            textarea.value = localNote || '';
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (textarea) {
                    localStorage.setItem('vcl_idea_note', textarea.value);
                    alert('保存しました');
                }
            });
        }
    }

    return container;
}
