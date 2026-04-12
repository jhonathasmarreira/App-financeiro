import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas.');
}

const baseOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, baseOptions);

/** Creates a Supabase client that sends the user's JWT in every request.
 *  Required for Row Level Security policies that use auth.jwt() ->> 'sub'. */
export function createAuthClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...baseOptions,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
