const API_BASE = '/api/progress';
const SCHOOL_API_BASE = '/api/school';

function getStudentToken() {
    return localStorage.getItem('vcl_student_token');
}

function getCurrentUserId() {
    try {
        const user = localStorage.getItem('vcl_user');
        if (!user) return null;
        const parsed = JSON.parse(user);
        return parsed?.id || null;
    } catch (error) {
        return null;
    }
}

export async function getUserProgress() {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const response = await fetch(`${API_BASE}/${userId}`);
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load progress');
    }

    return response.json();
}

export async function recordExperimentProgress(experimentCode, status = 'completed') {
    const studentToken = getStudentToken();
    if (studentToken && experimentCode) {
        // 生徒ログイン時はSupabase学校運用APIへ保存する。
        const response = await fetch(`${SCHOOL_API_BASE}/students/progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${studentToken}`
            },
            body: JSON.stringify({ experimentCode, status })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to save student progress');
        }

        const data = await response.json();
        return data.progress;
    }

    const userId = getCurrentUserId();
    if (!userId || !experimentCode) return null;

    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, experimentCode, status })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save progress');
    }

    const data = await response.json();
    return data.progress;
}
