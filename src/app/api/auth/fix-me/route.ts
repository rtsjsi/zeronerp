import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError("No token found", 401);
    }
    const token = authHeader.replace("Bearer ", "");

    // 1. Get UID from session
    const supabase = createAdminClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      return apiError("Invalid session", 401);
    }

    // 2. Resolve Demo Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: "zeron-demo" },
    });

    if (!tenant) {
      return apiError("Demo tenant not found. Please run seed first.", 404);
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

    return apiSuccess({ user, tenant }, "Account linked successfully!");
  } catch (err: any) {
    return apiError(err.message, 500);
  }
}
