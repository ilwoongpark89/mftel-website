import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

/**
 * Supabase admin client using the service role key.
 * Use only in server-side code (API routes).
 */
export const supabaseAdmin = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    : null;
