import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * PATCH /api/admin/users/[id]
 * Update user status or details.
 */
export const PATCH = withAuth(async (req, ctx) => {
  const { id } = ctx.params;
  const body = await req.json();

  const user = await prisma.user.update({
    where: { id, tenantId: ctx.tenantId },
    data: {
      isActive: body.isActive !== undefined ? body.isActive : undefined,
      fullName: body.fullName || undefined,
    },
  });

  return apiSuccess(user, "User updated");
});

/**
 * DELETE /api/admin/users/[id]
 * Soft delete user.
 */
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = ctx.params;

  await prisma.user.update({
    where: { id, tenantId: ctx.tenantId },
    data: { isDeleted: true },
  });

  return apiSuccess(null, "User deleted");
});
