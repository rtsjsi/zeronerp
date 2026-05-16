export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * PATCH /api/admin/users/[id]
 * Update user status or details.
 */
export const PATCH = withAuth(async (req, ctx) => {
  const { id } = ctx.params;
  const body = await req.json();

  const updateData: any = {};
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.fullName) updateData.fullName = body.fullName;

  const { data: user, error } = await db()
    .from('User')
    .update(updateData)
    .eq('id', id)
    .eq('tenantId', ctx.tenantId)
    .select()
    .single();

  if (error) return apiError(error.message, 500);

  return apiSuccess(user, "User updated");
});

/**
 * DELETE /api/admin/users/[id]
 * Soft delete user.
 */
export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = ctx.params;

  const { error } = await db()
    .from('User')
    .update({ isDeleted: true })
    .eq('id', id)
    .eq('tenantId', ctx.tenantId);

  if (error) return apiError(error.message, 500);

  return apiSuccess(null, "User deleted");
});
