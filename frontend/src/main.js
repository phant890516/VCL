// Styles
import './assets/styles.css';

// Router
import { initRouter, navigateTo, registerRoute } from './router.js';

// Views
import { initSidebar } from './components/Sidebar.js';
import { ResultScene } from './scenes/ResultScene.js';
import { AdminView } from './views/Admin/index.js'; // 追加
import { ConnectionGuideView } from './views/ConnectionGuide/index.js';
import { DashboardView } from './views/Dashboard/index.js';
import { IdeaView } from './views/Idea/index.js';
import { LabView } from './views/Lab/index.js'; // Ensure this path is correct
import { LiveView } from './views/Live/index.js';
import { LoginView } from './views/Login/index.js';
import { RegisterView } from './views/Register/index.js';
import { SelectModeView } from './views/SelectMode/index.js';
import { SettingView } from './views/Setting/index.js';
import { TrophyView } from './views/Trophy/index.js';

console.log('VCL SPA Frontend Initialized');

function wrapView(ViewFunction) {
    return (params) => {
        const contentRoot = document.getElementById('content-root');
        if (contentRoot) {
            contentRoot.innerHTML = '';
            const viewElement = ViewFunction(navigateTo, params);
            if (viewElement) {
                contentRoot.appendChild(viewElement);
            }
        }
    };
}

function renderResult(params) {
    const contentRoot = document.getElementById('content-root');
    if (contentRoot) {
        contentRoot.innerHTML = '';
        contentRoot.appendChild(ResultScene(navigateTo, params));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // U22対応: ログイン画面をスキップしてダッシュボードを初期表示とする
    // registerRoute('/', wrapView(LoginView));
    registerRoute('/', wrapView(DashboardView));

    registerRoute('/register', wrapView(RegisterView));
    registerRoute('/login', wrapView(LoginView));

    registerRoute('/dashboard', wrapView(DashboardView));
    registerRoute('/home', wrapView(DashboardView)); // alias

    registerRoute('/connection-guide', wrapView(ConnectionGuideView));

    registerRoute('/select-mode', wrapView(SelectModeView));
    registerRoute('/quest', wrapView(SelectModeView)); // alias

    registerRoute('/idea', wrapView(IdeaView));
    registerRoute('/live', wrapView(LiveView));
    registerRoute('/trophy', wrapView(TrophyView));
    registerRoute('/admin', wrapView(AdminView));
    registerRoute('/setting', wrapView(SettingView));

    registerRoute('/lab', wrapView(LabView));       // navigateTo('lab', {id: '...'}) で呼ばれる
    registerRoute('/free-mode', (params) => {       // フリーモードショートカット
        wrapView(LabView)({ ...params, title: 'フリー実験' });
    });

    registerRoute('/result', renderResult);

    initSidebar((id) => {
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

    initRouter();
});
