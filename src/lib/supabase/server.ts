/**
 * Supabase Server Client
 * 
 * Creates Supabase clients for use in Server Components and API routes.
 * Uses the service role key for admin operations (user management, etc.)
 * and the anon key for regular authenticated operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Admin client — bypasses RLS, for server-side operations only */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Regular client with anon key — respects RLS */
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
