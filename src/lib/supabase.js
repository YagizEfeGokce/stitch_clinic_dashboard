import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
    // Do not throw to prevent app crash, handle null in AuthContext
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            // Prevent Supabase from aggressively parsing the URL on every focus/load
            // We handle this manually or let the AuthContext event listener handle it.
            detectSessionInUrl: false,
            // Keep autoRefreshToken enabled for security, but we won't block UI on it.
            autoRefreshToken: true,
            persistSession: true
        }
    })
    : null;
