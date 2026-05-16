/**
 * Supabase Database Client
 * 
 * Replaces Prisma with direct Supabase SDK calls.
 * Uses the service role key to bypass RLS for server-side operations.
 * Works natively on Cloudflare Workers via HTTPS (no TCP required).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _db: SupabaseClient | null = null;

/** 
 * Get the Supabase admin client for database operations.
 * Uses service_role key to bypass RLS.
 */
export function db(): SupabaseClient {
  if (_db) return _db;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _db = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _db;
}

export default db;
