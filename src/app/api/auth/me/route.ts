/**
 * GET /api/auth/me
 * 
 * Returns the authenticated user's profile including tenant info and permissions.
 * Used by the client-side AuthContext to hydrate user state.
 */

export const runtime = "nodejs";
import { withAuth } from "@/lib/auth-middleware";
import { apiSuccess } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  return apiSuccess({
    id: ctx.user.id,
    email: ctx.user.email,
    fullName: ctx.user.fullName,
    tenantId: ctx.tenant.id,
    tenantName: ctx.tenant.name,
    permissions: ctx.permissions,
  });
});
