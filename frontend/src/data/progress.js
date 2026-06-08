const SCHOOL_API_BASE = '/api/school';

function getStudentToken() {
    // 生徒JWTがある場合は、学校運用のSupabase保存を優先する。
    return localStorage.getItem('vcl_student_token');
}

export async function getUserProgress() {
    // TODO: ここに通常ログインユーザーの進捗取得処理を書く。
    // 生徒ログインの進捗は先生ダッシュボード向けにSupabase側へ保存する。
    return [];
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

    // TODO: ここに通常ログインユーザーの進捗保存処理を書く。
    // DB実装が決まるまでは、ゲストや通常ログインでは進捗をDB保存しない。
    return null;
}
