/**
 * Auth Middleware
 * 
 * Extracts and validates the JWT from the Authorization header,
 * resolves the User + Tenant from the database, and injects
 * an AuthContext into route handler callbacks.
 * 
 * Usage:
 *   export const GET = withAuth(async (req, ctx) => {
 *     const { user, tenant } = ctx;
 *     return apiSuccess({ user });
 *   });
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-response';

/** Context injected into authenticated route handlers */
export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  supabaseUid: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    settings: unknown;
    aiEnabled: boolean;
  };
  permissions: string[];
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext,
) => Promise<Response>;

/**
 * HOF that wraps a route handler with auth validation.
 * Extracts JWT, validates via Supabase, resolves user & tenant.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    try {
      // 1. Extract token
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return apiError('Missing or invalid authorization header', 401);
      }
      const token = authHeader.replace('Bearer ', '');

      // 2. Validate with Supabase
      const supabase = createAdminClient();
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

      if (error || !supabaseUser) {
        return apiError('Invalid or expired token', 401);
      }

      // 3. Resolve application user
      const user = await prisma.user.findFirst({
        where: {
          supabaseUid: supabaseUser.id,
          isActive: true,
        },
      });

      if (!user) {
        return apiError('User not found in application', 403);
      }

      // 4. Resolve tenant
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: user.tenantId,
          isActive: true,
        },
      });

      if (!tenant) {
        return apiError('Tenant not found or inactive', 403);
      }

      // 5. Resolve permissions
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      const permissions = (userRoles as any[]).flatMap((ur) =>
        ur.role.rolePermissions.map(
          (rp: any) => `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`,
        ),
      );

      // 6. Build context
      const ctx: AuthContext = {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        supabaseUid: supabaseUser.id,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          tenantId: user.tenantId,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          settings: tenant.settings,
          aiEnabled: tenant.aiEnabled,
        },
        permissions,
      };

      return handler(req, ctx);
    } catch (err) {
      console.error('[Auth Middleware Error]', err);
      return apiError('Authentication failed', 500);
    }
  };
}

/**
 * Check if the user has a specific permission.
 * Permission format: "module:resource:action"
 */
export function hasPermission(
  permissions: string[],
  module: string,
  resource: string,
  action: string,
): boolean {
  return permissions.includes(`${module}:${resource}:${action}`);
}
