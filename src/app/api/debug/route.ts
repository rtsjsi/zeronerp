export const dynamic = "force-dynamic";

/**
 * GET /api/debug
 * 
 * Diagnostic endpoint — no auth required.
 * Tests each layer of the stack independently to identify 500 errors.
 * DELETE THIS IN PRODUCTION once issues are resolved.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    runtime: typeof (globalThis as any).caches !== 'undefined' ? 'cloudflare-worker' : 'nodejs',
  };

  // 1. Check environment variables
  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `SET (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  };

  // 2. Test database connection
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5000,
    });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as time, current_database() as db');
    results.database = {
      status: 'CONNECTED',
      time: res.rows[0].time,
      db: res.rows[0].db,
    };
    client.release();
    await pool.end();
  } catch (err: any) {
    results.database = {
      status: 'FAILED',
      error: err.message,
      code: err.code,
      stack: err.stack?.split('\n').slice(0, 3),
    };
  }

  // 3. Test Prisma
  try {
    const { prisma } = await import('@/lib/prisma');
    const tenantCount = await prisma.tenant.count();
    results.prisma = {
      status: 'CONNECTED',
      tenantCount,
    };
  } catch (err: any) {
    results.prisma = {
      status: 'FAILED',
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 3),
    };
  }

  return NextResponse.json(results, { status: 200 });
}
