/**
 * GET /api/health
 * 
 * Public health check endpoint — no auth required.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "healthy",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    },
    message: "ZeronERP is running",
    errors: null,
    pagination: null,
  });
}
