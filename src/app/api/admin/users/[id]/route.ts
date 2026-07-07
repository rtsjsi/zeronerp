export const dynamic = "force-dynamic";
import { and, eq } from 'drizzle-orm';
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { applicationUsers } from '@/db/schema';
import { now } from '@/db/helpers';
import { apiSuccess, apiError } from "@/lib/api-response";

export const PATCH = withAuth(async (req, ctx) => {
  const { id } = ctx.params;
  const body = (await req.json()) as {
    isActive?: boolean;
    fullName?: string;
  };

  const updateData: Record<string, unknown> = { updatedAt: now() };
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.fullName) updateData.fullName = body.fullName;

  const [user] = await db()
    .update(applicationUsers)
    .set(updateData)
    .where(and(eq(applicationUsers.id, id), eq(applicationUsers.storeId, ctx.storeId)))
    .returning();

  if (!user) return apiError('User not found', 404);

  return apiSuccess(user, "User updated");
});

export const DELETE = withAuth(async (_req, ctx) => {
  const { id } = ctx.params;

  const [user] = await db()
    .update(applicationUsers)
    .set({ isDeleted: true, updatedAt: now() })
    .where(and(eq(applicationUsers.id, id), eq(applicationUsers.storeId, ctx.storeId)))
    .returning();

  if (!user) return apiError('User not found', 404);

  return apiSuccess(null, "User deleted");
});
