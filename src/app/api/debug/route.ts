export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    runtime: typeof (globalThis as any).caches !== 'undefined' ? 'cloudflare-worker' : 'nodejs',
  };

  // 1. Check environment variables
  results.env = {
    NEXT_PUBLIC_SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL') ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY') ? 'SET' : 'MISSING',
    AVAILABLE_KEYS: Object.keys(process.env).join(', '),
  };

  // 2. Test Supabase connection
  try {
    const { db } = await import('@/lib/db');
    const supaDb = db();
    const { data, error } = await supaDb
      .from('Stores')
      .select('id, name')
      .limit(1);

    if (error) {
      results.database = {
        status: 'FAILED',
        error: error.message,
        code: error.code,
      };
    } else {
      results.database = {
        status: 'CONNECTED',
        tenants: data,
      };
    }
  } catch (err: any) {
    results.database = {
      status: 'FAILED',
      error: err.message,
    };
  }

  return NextResponse.json(results, { status: 200 });
}
