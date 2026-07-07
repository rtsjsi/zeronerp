/**
 * Auth Middleware
 *
 * Validates JWT and resolves user + store from D1.
 */

import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applicationUsers, stores } from '@/db/schema';
import { parseJson } from '@/db/helpers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { apiError } from '@/lib/api-response';

export interface AuthContext {
  userId: string;
  storeId: string;
  email: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    storeId: string;
    role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    settings: unknown;
    aiEnabled: boolean;
  };
  params: any;
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext,
) => Promise<Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    req: NextRequest,
    routeContext: { params: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const params = await routeContext.params;
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return apiError('Missing or invalid authorization header', 401);
      }
      const token = authHeader.replace('Bearer ', '');

      const payload = await verifyAuthToken(token);

      const database = db();
      const user = await database.query.applicationUsers.findFirst({
        where: and(
          eq(applicationUsers.id, payload.sub),
          eq(applicationUsers.isActive, true),
          eq(applicationUsers.isDeleted, false),
        ),
      });

      if (!user) {
        return apiError('User not found in application', 403);
      }

      let targetTenantId = user.storeId;

      if (user.role === 'SUPER_ADMIN') {
        const overrideCookie = req.cookies.get('zeron_superadmin_store_id');
        if (overrideCookie?.value) {
          targetTenantId = overrideCookie.value;
        }
      }

      let tenant = null;

      if (targetTenantId) {
        const tenantData = await database.query.stores.findFirst({
          where: and(
            eq(stores.id, targetTenantId),
            eq(stores.isActive, true),
            eq(stores.isDeleted, false),
          ),
        });

        if (!tenantData) {
          return apiError('Tenant not found or inactive', 403);
        }
        tenant = tenantData;
      } else if (user.role !== 'SUPER_ADMIN') {
        return apiError('Tenant not found or inactive', 403);
      }

      const ctx: AuthContext = {
        userId: user.id,
        storeId: tenant?.id || '',
        email: user.email,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          storeId: user.storeId || '',
          role: user.role as 'ADMIN' | 'USER' | 'SUPER_ADMIN',
        },
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              settings: parseJson(tenant.settings, {}),
              aiEnabled: tenant.aiEnabled,
            }
          : (null as any),
        params,
      };

      const path = req.nextUrl.pathname;

      if (!ctx.storeId && !path.startsWith('/api/super-admin') && !path.startsWith('/api/auth/me')) {
        return apiError('Store context required. Please select a store.', 400);
      }

      if (path.startsWith('/api/admin/users') && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return apiError('Permission denied: Admin access required', 403);
      }

      return handler(req, ctx);
    } catch (err) {
      console.error('[Auth Middleware Error]', err);
      return apiError('Authentication failed', 401);
    }
  };
}
