import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Sign in or sign up with mobile phone via Supabase Auth.
 * Falls back cleanly if Supabase Auth is not configured or fails.
 */
export async function supabaseSignInWithOtp(phone) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  return await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });
}

/**
 * Verify phone OTP via Supabase Auth.
 */
export async function supabaseVerifyOtp(phone, token) {
  if (!supabase) return { error: new Error('Supabase not configured') };
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  return await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: 'sms',
  });
}
