const API_BASE = '/api/school';

// 学校運用APIの薄いラッパー。画面側はfetchの詳細を意識しなくてよいようにする。
function getJsonHeaders(extra = {}) {
    return {
        'Content-Type': 'application/json',
        ...extra
    };
}

// 先生APIにはSupabase Authのアクセストークンを付ける。
function teacherHeaders() {
    const token = localStorage.getItem('vcl_teacher_access_token');
    return getJsonHeaders(token ? { Authorization: `Bearer ${token}` } : {});
}

// 生徒APIにはVCL独自の生徒JWTを付ける。
function studentHeaders() {
    const token = localStorage.getItem('vcl_student_token');
    return getJsonHeaders(token ? { Authorization: `Bearer ${token}` } : {});
}

async function parseResponse(response) {
    // API側のエラーメッセージを画面でそのまま扱えるように整える。
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export function saveTeacherAccessToken(accessToken) {
    // Supabaseのセッション全体ではなく、先生APIに必要なアクセストークンだけ保持する。
    localStorage.setItem('vcl_teacher_access_token', accessToken);
}

// ログイン中の先生プロフィールを取得する。
export async function getTeacherProfile() {
    const response = await fetch(`${API_BASE}/teacher/me`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

// 先生が作成したクラス一覧を取得する。
export async function listTeacherClasses() {
    const response = await fetch(`${API_BASE}/teacher/classes`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

// 先生用の新しいクラスを作成する。
export async function createTeacherClass(name) {
    const response = await fetch(`${API_BASE}/teacher/classes`, {
        method: 'POST',
        headers: teacherHeaders(),
        body: JSON.stringify({ name })
    });
    return parseResponse(response);
}

// 指定クラスに所属する生徒一覧を取得する。
export async function listClassStudents(classId) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/students`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

// 先生が生徒IDと初期パスワードを発行する。
export async function createClassStudent(classId, displayName) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/students`, {
        method: 'POST',
        headers: teacherHeaders(),
        body: JSON.stringify({ displayName })
    });
    return parseResponse(response);
}

// 先生画面で使う、クラス全体の進捗ボードを取得する。
export async function getClassProgressBoard(classId) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/progress`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

// 生徒IDログインを行い、以後の生徒API用JWTを保存する。
export async function loginStudent(loginId, password) {
    const response = await fetch(`${API_BASE}/students/login`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify({ loginId, password })
    });
    const data = await parseResponse(response);
    localStorage.setItem('vcl_student_token', data.token);
    localStorage.setItem('vcl_user', JSON.stringify({
        id: data.student.id,
        username: data.student.login_id,
        nickname: data.student.display_name,
        role: 'student',
        mustChangePassword: data.student.must_change_password
    }));
    return data;
}

// 初回ログイン後などに、生徒自身のパスワードを変更する。
export async function changeStudentPassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE}/students/change-password`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    });
    return parseResponse(response);
}

// 実験中または実験完了時の生徒進捗をSupabaseへ保存する。
export async function recordStudentProgress(experimentCode, progress) {
    const response = await fetch(`${API_BASE}/students/progress`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ experimentCode, ...progress })
    });
    return parseResponse(response);
}

// 生徒が獲得したトロフィーを学校運用DBへ保存する。
export async function unlockStudentTrophy(trophyId) {
    const response = await fetch(`${API_BASE}/students/trophies`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ trophyId })
    });
    return parseResponse(response);
}
