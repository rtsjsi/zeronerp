import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const userSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6),
});

/**
 * GET /api/admin/users
 */
export const GET = withAuth(async (_req, ctx) => {
  const users = await prisma.user.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(users);
});

/**
 * POST /api/admin/users
 * Directly create a new user (DB + Supabase).
 */
export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400);
    }

    const { email, fullName, password } = parsed.data;

    // 1. Create in Supabase Auth Directly
    const supabase = createAdminClient();
    const { data: sbUser, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (sbError) {
      return apiError(`Supabase Error: ${sbError.message}`, 400);
    }

    // 2. Create in DB
    const user = await prisma.user.create({
      data: {
        tenantId: ctx.tenantId,
        email,
        fullName,
        supabaseUid: sbUser.user.id,
        isActive: true,
      },
    });

    return apiSuccess(user, "User created successfully", 201);
  } catch (err: any) {
    console.error("[Admin Users API Error]", err);
    return apiError(err.message || "Internal server error", 500);
  }
});
