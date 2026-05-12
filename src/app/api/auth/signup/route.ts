/**
 * POST /api/auth/signup
 * 
 * Registers a new user and creates a tenant.
 * This is an admin/setup endpoint — not for public use.
 */

export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  tenantName: z.string().min(2),
  tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const errors: Record<string, string[]> = {};
      parsed.error.issues.forEach((e) => {
        const field = e.path.join(".");
        if (!errors[field]) errors[field] = [];
        errors[field].push(e.message);
      });
      return apiError("Validation failed", 400, errors);
    }

    const { email, password, fullName, tenantName, tenantSlug } = parsed.data;

    // Check tenant slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (existingTenant) {
      return apiError("This organization slug is already taken", 409);
    }

    // Create Supabase auth user
    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return apiError(authError?.message || "Failed to create auth user", 500);
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
      },
    });

    // Create default admin role
    const adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: "Admin",
        description: "Full access to all modules",
        isSystem: true,
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        fullName,
        supabaseUid: authData.user.id,
        createdBy: null,
      },
    });

    // Assign admin role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    return apiSuccess(
      {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
      },
      "Account created successfully",
      201,
    );
  } catch (error) {
    console.error("[Signup Error]", error);
    return apiError("Failed to create account", 500);
  }
}
