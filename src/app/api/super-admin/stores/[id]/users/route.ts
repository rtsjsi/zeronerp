import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { apiSuccess, apiError } from '@/lib/api-response';
import { SuperAdminService } from '@/lib/services/super-admin.service';

export const GET = withAuth(async (req, ctx) => {
  if (ctx.user.role !== 'SUPER_ADMIN') return apiError('Forbidden', 403);
  try {
    const users = await SuperAdminService.getUsersForStore(ctx.params.id);
    return apiSuccess(users);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
});

export const POST = withAuth(async (req, ctx) => {
  if (ctx.user.role !== 'SUPER_ADMIN') return apiError('Forbidden', 403);
  try {
    const body = await req.json();
    if (!body.email || !body.fullName) return apiError('Email and full name are required', 400);

    const user = await SuperAdminService.createUserForStore(ctx.params.id, {
      email: body.email,
      fullName: body.fullName,
      password: body.password,
      role: body.role || 'USER',
    });
    return apiSuccess(user, "Success", 201);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
});
