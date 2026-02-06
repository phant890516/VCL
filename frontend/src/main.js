// Styles
import './assets/styles.css';

// Router
import { initRouter, navigateTo, registerRoute } from './router.js';

// Views
import { initSidebar } from './components/Sidebar.js';
import { ResultScene } from './scenes/ResultScene.js';
import { DashboardView } from './views/Dashboard/index.js';
import { IdeaView } from './views/Idea/index.js';
import { LabView } from './views/Lab/index.js';
import { LiveView } from './views/Live/index.js';
import { LoginView } from './views/Login/index.js';
import { RegisterView } from './views/Register/index.js';
import { SelectModeView } from './views/SelectMode/index.js';
import { SettingView } from './views/Setting/index.js';
import { TrophyView } from './views/Trophy/index.js';

console.log('VCL SPA Frontend Initialized');

// ルーター用のラッパー関数
// View関数は(navigateTo function, params object)を受け取る設計になっているため
function wrapView(ViewFunction) {
    return (params) => {
        const contentRoot = document.getElementById('content-root');
        if (contentRoot) {
            contentRoot.innerHTML = '';
            // Sidebarの表示制御: Login/Register画面ではサイドバーを隠したいかもしれない
            // しかし現在の実装ではHTML側に固定されている可能性もあるので、ここではViewのレンダリングのみ行う

            // Viewを生成してDOMに追加
            const viewElement = ViewFunction(navigateTo, params);
            if (viewElement) {
                contentRoot.appendChild(viewElement);
            }
        }
    };
}

// ResultSceneは古い構造(classなど)かもしれないのでアダプタ
function renderResult(params) {
    const contentRoot = document.getElementById('content-root');
    if (contentRoot) {
        contentRoot.innerHTML = '';
        contentRoot.appendChild(ResultScene(navigateTo, params));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. ルート登録
    registerRoute('/', wrapView(LoginView));
    registerRoute('/register', wrapView(RegisterView));
    registerRoute('/login', wrapView(LoginView));

    registerRoute('/dashboard', wrapView(DashboardView));
    registerRoute('/home', wrapView(DashboardView)); // alias

    registerRoute('/select-mode', wrapView(SelectModeView));
    registerRoute('/quest', wrapView(SelectModeView)); // alias

    registerRoute('/idea', wrapView(IdeaView));
    registerRoute('/live', wrapView(LiveView));
    registerRoute('/trophy', wrapView(TrophyView));
    registerRoute('/setting', wrapView(SettingView));

    registerRoute('/lab', wrapView(LabView));       // navigateTo('lab', {id: '...'}) で呼ばれる
    registerRoute('/free-mode', (params) => {       // フリーモードショートカット
        wrapView(LabView)({ ...params, title: 'フリー実験' });
    });

    registerRoute('/result', renderResult);

    // 2. サイドバー初期化
    initSidebar((id) => {
        // data-id="home" などをパスに変換
        const pathMap = {
            'home': '/dashboard',
            'quest': '/select-mode',
            'idea': '/idea',
            'live': '/live',
            'trophy': '/trophy',
            'setting': '/setting'
        };
        const path = pathMap[id] || '/dashboard';
        navigateTo(path);
    });

    // 3. ルーター起動 (現在のURLに応じて画面表示)
    initRouter();
});
