import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../config/supabaseClient.js';
import { signStudentToken } from '../utils/schoolJwt.js';

const ALLOWED_PROGRESS_STATUSES = new Set([
    'not_started',
    'started',
    'reagent_added',
    'mixing',
    'completed',
    'failed'
]);

// クラスコードや初期パスワードに使う短いランダム文字列。
function randomCode(length = 6) {
    return crypto.randomBytes(8).toString('hex').slice(0, length).toUpperCase();
}

// 先生が生徒へ配る初期パスワード。初回ログイン後に変更させる前提。
function randomPassword() {
    return `VCL-${randomCode(6)}`;
}

// Supabaseの戻り値をまとめて検査し、呼び出し側の処理を読みやすくする。
function assertSupabaseResult(result) {
    if (result.error) throw result.error;
    return result.data;
}

function clampPercent(value) {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function calculateProgressPercent(status, mixingProgress = 0, requiredMixing = 300, explicitPercent = null) {
    const direct = clampPercent(explicitPercent);
    if (direct !== null) return direct;

    if (status === 'not_started') return 0;
    if (status === 'started') return 25;
    if (status === 'reagent_added') return 50;
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;

    // 混合中だけは、薬品投入済みの50%から成功直前の99%までを混合量で補間する。
    const required = Number(requiredMixing) > 0 ? Number(requiredMixing) : 300;
    const mixed = Math.max(0, Number(mixingProgress) || 0);
    const dynamic = 50 + (Math.min(mixed / required, 0.98) * 50);
    return Math.max(50, Math.min(99, Math.round(dynamic)));
}

export class SchoolService {
    constructor() {
        this.supabase = getSupabaseAdmin();
    }

    async listClasses(teacherId) {
        return assertSupabaseResult(await this.supabase
            .from('classes')
            .select('id, name, class_code, created_at, updated_at')
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false }));
    }

    async createClass(teacherId, name) {
        if (!name || String(name).trim().length < 1) {
            throw new Error('Class name is required.');
        }

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const classCode = randomCode(6);
            const result = await this.supabase
                .from('classes')
                .insert({
                    teacher_id: teacherId,
                    name: String(name).trim(),
                    class_code: classCode
                })
                .select('id, name, class_code, created_at, updated_at')
                .single();

            if (!result.error) return result.data;
            if (result.error.code !== '23505') throw result.error;
        }

        throw new Error('Failed to generate a unique class code.');
    }

    async getTeacherClass(teacherId, classId) {
        const klass = assertSupabaseResult(await this.supabase
            .from('classes')
            .select('id, teacher_id, name, class_code, created_at, updated_at')
            .eq('id', classId)
            .eq('teacher_id', teacherId)
            .maybeSingle());

        if (!klass) throw new Error('Class not found.');
        return klass;
    }

    async listStudents(teacherId, classId) {
        await this.getTeacherClass(teacherId, classId);

        return assertSupabaseResult(await this.supabase
            .from('students')
            .select('id, login_id, display_name, must_change_password, last_login_at, created_at')
            .eq('class_id', classId)
            .order('login_id', { ascending: true }));
    }

    async createStudent(teacherId, classId, displayName) {
        if (!displayName || String(displayName).trim().length < 1) {
            throw new Error('Student display name is required.');
        }

        const klass = await this.getTeacherClass(teacherId, classId);
        const existing = await this.listStudents(teacherId, classId);
        const nextNumber = existing.length + 1;
        // 生徒IDは「クラスコード-出席番号」の形で、先生が配りやすい文字列にする。
        const loginId = `${klass.class_code}-${String(nextNumber).padStart(3, '0')}`;
        const initialPassword = randomPassword();
        const passwordHash = await bcrypt.hash(initialPassword, 10);

        const student = assertSupabaseResult(await this.supabase
            .from('students')
            .insert({
                class_id: classId,
                login_id: loginId,
                display_name: String(displayName).trim(),
                password_hash: passwordHash,
                must_change_password: true
            })
            .select('id, class_id, login_id, display_name, must_change_password, created_at')
            .single());

        return {
            ...student,
            initialPassword
        };
    }

    async loginStudent(loginId, password) {
        if (!loginId || !password) {
            throw new Error('Student ID and password are required.');
        }

        const student = assertSupabaseResult(await this.supabase
            .from('students')
            .select('id, class_id, login_id, display_name, password_hash, must_change_password')
            .eq('login_id', loginId)
            .maybeSingle());

        if (!student) throw new Error('Student ID or password is incorrect.');

        const isValid = await bcrypt.compare(password, student.password_hash);
        if (!isValid) throw new Error('Student ID or password is incorrect.');

        await this.supabase
            .from('students')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', student.id);

        const token = signStudentToken(student);
        const { password_hash: _, ...safeStudent } = student;

        return {
            token,
            student: safeStudent
        };
    }

    async changeStudentPassword(studentId, currentPassword, newPassword) {
        if (!newPassword || String(newPassword).length < 8) {
            throw new Error('New password must be at least 8 characters.');
        }

        const student = assertSupabaseResult(await this.supabase
            .from('students')
            .select('id, password_hash')
            .eq('id', studentId)
            .single());

        const isValid = await bcrypt.compare(currentPassword || '', student.password_hash);
        if (!isValid) throw new Error('Current password is incorrect.');

        const passwordHash = await bcrypt.hash(newPassword, 10);
        assertSupabaseResult(await this.supabase
            .from('students')
            .update({ password_hash: passwordHash, must_change_password: false })
            .eq('id', studentId)
            .select('id')
            .single());

        return { success: true };
    }

    async recordStudentProgress(studentId, experimentCode, payload = {}) {
        if (!experimentCode) throw new Error('Experiment code is required.');

        const status = String(payload.status || 'started').toLowerCase();
        if (!ALLOWED_PROGRESS_STATUSES.has(status)) {
            throw new Error('Invalid progress status.');
        }

        const experiment = assertSupabaseResult(await this.supabase
            .from('experiments')
            .select('id, experiment_code, title')
            .eq('experiment_code', experimentCode)
            .single());

        const mixingProgress = Number(payload.mixingProgress || 0);
        const requiredMixing = Number(payload.requiredMixing || 300);
        const progressPercent = calculateProgressPercent(
            status,
            mixingProgress,
            requiredMixing,
            payload.progressPercent
        );

        const now = new Date().toISOString();
        // 同じ生徒・同じ実験は1行に集約し、最新状態へ更新する。
        const row = {
            student_id: studentId,
            experiment_id: experiment.id,
            status,
            progress_percent: progressPercent,
            mixing_progress: mixingProgress,
            required_mixing: requiredMixing,
            updated_at: now
        };

        if (status !== 'not_started') row.started_at = payload.startedAt || now;
        if (status === 'completed') row.completed_at = payload.completedAt || now;

        const progress = assertSupabaseResult(await this.supabase
            .from('student_progress')
            .upsert(row, { onConflict: 'student_id,experiment_id' })
            .select(`
                id,
                status,
                progress_percent,
                mixing_progress,
                required_mixing,
                started_at,
                completed_at,
                updated_at
            `)
            .single());

        return {
            ...progress,
            experiment_code: experiment.experiment_code,
            title: experiment.title
        };
    }

    async unlockStudentTrophy(studentId, trophyId) {
        if (!trophyId) throw new Error('Trophy ID is required.');

        return assertSupabaseResult(await this.supabase
            .from('student_trophies')
            .upsert(
                { student_id: studentId, trophy_id: trophyId },
                { onConflict: 'student_id,trophy_id', ignoreDuplicates: true }
            )
            .select('id, student_id, trophy_id, acquired_at')
            .maybeSingle());
    }

    async getClassProgressBoard(teacherId, classId) {
        const klass = await this.getTeacherClass(teacherId, classId);
        const students = await this.listStudents(teacherId, classId);
        const experiments = assertSupabaseResult(await this.supabase
            .from('experiments')
            .select('id, experiment_code, title, display_order')
            .eq('is_available', true)
            .order('display_order', { ascending: true }));

        const studentIds = students.map(student => student.id);
        if (studentIds.length === 0) {
            return { class: klass, experiments, students: [] };
        }

        const progressRows = assertSupabaseResult(await this.supabase
            .from('student_progress')
            .select(`
                student_id,
                status,
                progress_percent,
                mixing_progress,
                required_mixing,
                updated_at,
                experiments (experiment_code, title)
            `)
            .in('student_id', studentIds));

        const trophyRows = assertSupabaseResult(await this.supabase
            .from('student_trophies')
            .select('student_id, trophy_id')
            .in('student_id', studentIds));

        // 先生画面で扱いやすいよう、生徒ごと・実験コードごとの形に整形する。
        const progressByStudent = new Map();
        for (const row of progressRows) {
            if (!progressByStudent.has(row.student_id)) {
                progressByStudent.set(row.student_id, {});
            }
            progressByStudent.get(row.student_id)[row.experiments.experiment_code] = {
                status: row.status,
                progressPercent: row.progress_percent,
                mixingProgress: row.mixing_progress,
                requiredMixing: row.required_mixing,
                updatedAt: row.updated_at
            };
        }

        const trophyCountByStudent = new Map();
        for (const row of trophyRows) {
            trophyCountByStudent.set(row.student_id, (trophyCountByStudent.get(row.student_id) || 0) + 1);
        }

        return {
            class: klass,
            experiments,
            students: students.map(student => ({
                ...student,
                trophyCount: trophyCountByStudent.get(student.id) || 0,
                progress: progressByStudent.get(student.id) || {}
            }))
        };
    }
}
