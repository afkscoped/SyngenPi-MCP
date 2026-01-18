
import { createClient } from '@supabase/supabase-js';

// Factory function to ensure runtime environment access
// This prevents build-time access to process.env keys which causes next build failures
export function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and Key must be defined');
    }

    return createClient(supabaseUrl, supabaseKey);
}

// For server-side operations that need the service role (admin)
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase Service Key required for admin operations');
    }

    return createClient(supabaseUrl, serviceKey);
}
