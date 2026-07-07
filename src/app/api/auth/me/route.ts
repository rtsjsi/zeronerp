export const dynamic = "force-dynamic";
/**
 * GET /api/auth/me
 * 
 * Returns the authenticated user's profile including tenant info.
 */

import { withAuth } from "@/lib/auth-middleware";
import { apiSuccess } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  return apiSuccess({
    id: ctx.user.id,
    username: ctx.user.username,
    fullName: ctx.user.fullName,
    storeId: ctx.tenant?.id || null,
    tenantName: ctx.tenant?.name || null,
    role: ctx.user.role,
  });
});
