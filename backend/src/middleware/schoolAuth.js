import { getSupabaseAdmin, getSupabaseAuthUser, getBearerToken } from '../config/supabaseClient.js';
import { verifySchoolToken } from '../utils/schoolJwt.js';

// 先生向けAPIの入口。Supabase AuthのJWTを検証し、teacher_profilesを自動で用意する。
export async function requireTeacher(req, res, next) {
    try {
        const user = await getSupabaseAuthUser(req.headers.authorization);

        if (!user.email_confirmed_at && process.env.ALLOW_UNVERIFIED_TEACHERS !== 'true') {
            return res.status(403).json({ error: 'Teacher email verification is required.' });
        }

        const supabase = getSupabaseAdmin();
        const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Teacher';
        const email = user.email || '';

        const { data: profile, error } = await supabase
            .from('teacher_profiles')
            .upsert(
                {
                    id: user.id,
                    email,
                    display_name: displayName
                },
                { onConflict: 'id' }
            )
            .select('id, email, display_name')
            .single();

        if (error) throw error;

        req.teacher = profile;
        req.supabaseUser = user;
        next();
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

// 生徒向けAPIの入口。生徒はSupabase Authではなく、VCL独自JWTで認証する。
export function requireStudent(req, res, next) {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Student bearer token is required.' });
        }

        const payload = verifySchoolToken(token);
        if (payload.role !== 'student' || !payload.studentId) {
            return res.status(403).json({ error: 'Student token is required.' });
        }

        req.studentAuth = payload;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid student token.' });
    }
}
