import { createClient } from '@supabase/supabase-js';

let adminClient = null;

// バックエンドだけが使うSupabase管理用クライアント。
// service_role key はブラウザに出さず、必ずサーバー側だけで扱う。
export function isSupabaseConfigured() {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    if (!adminClient) {
        adminClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                    detectSessionInUrl: false
                }
            }
        );
    }

    return adminClient;
}

export function getBearerToken(authHeader) {
    if (!authHeader || typeof authHeader !== 'string') return null;
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
}

// 先生用APIでは、受け取ったSupabase AuthのアクセストークンをAuthサーバーへ問い合わせて検証する。
export async function getSupabaseAuthUser(authHeader) {
    const token = getBearerToken(authHeader);
    if (!token) {
        throw new Error('Authorization bearer token is required.');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
        throw new Error('Invalid Supabase auth token.');
    }

    return data.user;
}
