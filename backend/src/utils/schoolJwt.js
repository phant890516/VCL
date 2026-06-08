import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'vcl_secret_key_2026';

function getJwtSecret() {
    // 本番ではVCL_JWT_SECRETを必ず設定する。未設定時の値は開発用。
    return process.env.VCL_JWT_SECRET || DEFAULT_SECRET;
}

export function signStudentToken(student) {
    // 生徒はメール認証を使わないため、ログイン成功後にVCL用の短時間JWTを発行する。
    return jwt.sign(
        {
            sub: student.id,
            role: 'student',
            studentId: student.id,
            classId: student.class_id,
            loginId: student.login_id,
            displayName: student.display_name
        },
        getJwtSecret(),
        { expiresIn: '12h' }
    );
}

export function verifySchoolToken(token) {
    // 生徒向けAPIでは、この検証結果のstudentIdだけを保存対象に使う。
    return jwt.verify(token, getJwtSecret());
}
