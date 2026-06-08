import { createClient } from '@supabase/supabase-js';
import { saveTeacherAccessToken } from './schoolApi.js';

let client = null;

// 先生ログイン用のSupabaseクライアント。
// anon / publishable key だけを使い、service_role key はフロントに置かない。
export function getSupabaseClient() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error('Supabase frontend env is not configured.');
    }

    if (!client) {
        client = createClient(url, anonKey);
    }

    return client;
}

// 先生アカウントをSupabase Authへ登録する。
export async function signUpTeacher(email, password, displayName) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    if (error) throw error;
    return data;
}

// 先生ログイン後、バックエンドの先生APIへ渡すアクセストークンを保存する。
export async function signInTeacher(email, password) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.session?.access_token) {
        // バックエンドの先生APIへ渡すため、アクセストークンだけ保存する。
        saveTeacherAccessToken(data.session.access_token);
    }

    return data;
}

// Supabase Authからログアウトし、先生API用の保存トークンも消す。
export async function signOutTeacher() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('vcl_teacher_access_token');
}
