/**
 * Auth Middleware (Supabase SDK)
 * 
 * Extracts and validates the JWT from the Authorization header,
 * resolves the User + Tenant from the database via Supabase SDK,
 * and injects an AuthContext into route handler callbacks.
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { apiError } from '@/lib/api-response';

/** Context injected into authenticated route handlers */
export interface AuthContext {
  userId: string;
  storeId: string;
  email: string;
  supabaseUid: string;
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

/**
 * HOF that wraps a route handler with auth validation.
 * Extracts JWT, validates via Supabase, resolves user & tenant.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, { params }: { params: any }) => {
    try {
      // 1. Extract token
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return apiError('Missing or invalid authorization header', 401);
      }
      const token = authHeader.replace('Bearer ', '');

      // 2. Validate with Supabase
      const supabase = createServerClient();
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

      if (error || !supabaseUser) {
        return apiError('Invalid or expired token', 401);
      }

      // 3. Resolve application user via Supabase SDK
      const supaDb = db();
      const { data: user, error: userErr } = await supaDb
        .from('ApplicationUsers')
        .select('*')
        .eq('supabaseUid', supabaseUser.id)
        .eq('isActive', true)
        .eq('isDeleted', false)
        .single();

      if (userErr || !user) {
        return apiError(userErr ? `DB Error (User): ${userErr.message}` : 'User not found in application', 403);
      }

      // 4. Resolve tenant
      let targetTenantId = user.storeId;

      // If user is SUPER_ADMIN, they can override the tenant via cookie
      if (user.role === 'SUPER_ADMIN') {
        // We will read a cookie 'zeron_superadmin_store_id' if available
        const overrideCookie = req.cookies.get('zeron_superadmin_store_id');
        if (overrideCookie?.value) {
          targetTenantId = overrideCookie.value;
        }
      }

      let tenant = null;
      
      // Target tenant might be null if a SUPER_ADMIN has no default store and hasn't selected one
      if (targetTenantId) {
        const { data: tenantData, error: tenantErr } = await supaDb
          .from('Stores')
          .select('*')
          .eq('id', targetTenantId)
          .eq('isActive', true)
          .eq('isDeleted', false)
          .single();

        if (tenantErr || !tenantData) {
          return apiError(tenantErr ? `DB Error (Tenant): ${tenantErr.message}` : 'Tenant not found or inactive', 403);
        }
        tenant = tenantData;
      } else if (user.role !== 'SUPER_ADMIN') {
        // Normal users must have a valid tenant
        return apiError('Tenant not found or inactive', 403);
      }

      // 5. Build context
      const ctx: AuthContext = {
        userId: user.id,
        storeId: tenant?.id || '',
        email: user.email,
        supabaseUid: supabaseUser.id,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          storeId: user.storeId || '',
          role: user.role as 'ADMIN' | 'USER' | 'SUPER_ADMIN',
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          settings: tenant.settings,
          aiEnabled: tenant.aiEnabled,
        } : null as any,
        params,
      };

      // 6. Role-based path restrictions
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
      return apiError('Authentication failed', 500);
    }
  };
}
