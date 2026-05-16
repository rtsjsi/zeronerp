import { createServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Check Env
    if (!process.env.DATABASE_URL) {
      return apiError("Environment Error: DATABASE_URL is missing in Cloudflare Dashboard.", 500);
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError("No token found", 401);
    }
    const token = authHeader.replace("Bearer ", "");

    // 1. Get UID from session
    const supabase = createServerClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error) {
      return apiError(`Supabase Error: ${error.message}`, 401);
    }
    if (!supabaseUser) {
      return apiError("No user found in session", 401);
    }

    // 2. Resolve Demo Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "zeron-demo" },
    });

    if (!tenant) {
      return apiError("Database Error: Demo tenant 'zeron-demo' not found. Please run seed.", 404);
    }

    // 3. Upsert User
    const user = await prisma.user.upsert({
      where: { supabaseUid: supabaseUser.id },
      update: {
        tenantId: tenant.id,
        email: supabaseUser.email || "user@demo.com",
        isActive: true,
      },
      create: {
        supabaseUid: supabaseUser.id,
        tenantId: tenant.id,
        email: supabaseUser.email || "user@demo.com",
        fullName: "Admin User",
        isActive: true,
      },
    });

    return apiSuccess({ user, tenant }, `Success! Linked ${supabaseUser.email}`);
  } catch (err: any) {
    return apiError(`Runtime Error: ${err.message}`, 500);
  }
}
