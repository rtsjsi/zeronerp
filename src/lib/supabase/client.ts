/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for use in client components.
 * This uses the public anon key and respects RLS policies.
 * Gracefully returns null if env vars are not configured yet.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Singleton browser client */
let browserClient: SupabaseClient | null = null;
let initAttempted = false;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (initAttempted) return browserClient;
  initAttempted = true;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes('[') || key.includes('[')) {
      console.warn('[Supabase] Not configured — auth features will be unavailable');
      return null;
    }

    browserClient = createClient(url, key);
    return browserClient;
  } catch (error) {
    console.warn('[Supabase] Failed to initialise client:', error);
    return null;
  }
}
