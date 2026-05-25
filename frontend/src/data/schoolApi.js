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
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    return data;
}

export function saveTeacherAccessToken(accessToken) {
    localStorage.setItem('vcl_teacher_access_token', accessToken);
}

export async function getTeacherProfile() {
    const response = await fetch(`${API_BASE}/teacher/me`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

export async function listTeacherClasses() {
    const response = await fetch(`${API_BASE}/teacher/classes`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

export async function createTeacherClass(name) {
    const response = await fetch(`${API_BASE}/teacher/classes`, {
        method: 'POST',
        headers: teacherHeaders(),
        body: JSON.stringify({ name })
    });
    return parseResponse(response);
}

export async function listClassStudents(classId) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/students`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

export async function createClassStudent(classId, displayName) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/students`, {
        method: 'POST',
        headers: teacherHeaders(),
        body: JSON.stringify({ displayName })
    });
    return parseResponse(response);
}

export async function getClassProgressBoard(classId) {
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/progress`, {
        headers: teacherHeaders()
    });
    return parseResponse(response);
}

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

export async function changeStudentPassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE}/students/change-password`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    });
    return parseResponse(response);
}

export async function recordStudentProgress(experimentCode, progress) {
    const response = await fetch(`${API_BASE}/students/progress`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ experimentCode, ...progress })
    });
    return parseResponse(response);
}

export async function unlockStudentTrophy(trophyId) {
    const response = await fetch(`${API_BASE}/students/trophies`, {
        method: 'POST',
        headers: studentHeaders(),
        body: JSON.stringify({ trophyId })
    });
    return parseResponse(response);
}
