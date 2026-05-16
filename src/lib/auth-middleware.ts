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
        .from('User')
        .select('*')
        .eq('supabaseUid', supabaseUser.id)
        .eq('isActive', true)
        .eq('isDeleted', false)
        .single();

      if (userErr || !user) {
        return apiError(userErr ? `DB Error (User): ${userErr.message}` : 'User not found in application', 403);
      }

      // 4. Resolve tenant
      const { data: tenant, error: tenantErr } = await supaDb
        .from('Tenant')
        .select('*')
        .eq('id', user.tenantId)
        .eq('isActive', true)
        .eq('isDeleted', false)
        .single();

      if (tenantErr || !tenant) {
        return apiError(tenantErr ? `DB Error (Tenant): ${tenantErr.message}` : 'Tenant not found or inactive', 403);
      }

      // 5. Build context
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
        params,
      };

      return handler(req, ctx);
    } catch (err) {
      console.error('[Auth Middleware Error]', err);
      return apiError('Authentication failed', 500);
    }
  };
}
