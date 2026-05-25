import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'vcl_secret_key_2026';

function getJwtSecret() {
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
    return jwt.verify(token, getJwtSecret());
}
