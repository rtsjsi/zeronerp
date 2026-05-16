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
    email: ctx.user.email,
    fullName: ctx.user.fullName,
    tenantId: ctx.tenant.id,
    tenantName: ctx.tenant.name,
    role: ctx.user.role,
  });
});
