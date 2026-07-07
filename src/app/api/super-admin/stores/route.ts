import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { apiSuccess, apiError, parseRequestJson } from '@/lib/api-response';
import { SuperAdminService } from '@/lib/services/super-admin.service';

export const GET = withAuth(async (req, ctx) => {
  if (ctx.user.role !== 'SUPER_ADMIN') return apiError('Forbidden', 403);
  try {
    const stores = await SuperAdminService.getStores();
    return apiSuccess(stores);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
});

export const POST = withAuth(async (req, ctx) => {
  if (ctx.user.role !== 'SUPER_ADMIN') return apiError('Forbidden', 403);
  try {
    const body = await parseRequestJson<{
      name: string;
      address?: string;
      gstn?: string;
      contactNumber?: string;
    }>(req);
    if (!body.name) return apiError('Store name is required', 400);

    const store = await SuperAdminService.createStore({
      name: body.name,
      address: body.address,
      gstn: body.gstn,
      contactNumber: body.contactNumber,
    });
    return apiSuccess(store, "Success", 201);
  } catch (err: any) {
    return apiError(err.message, 500);
  }
});
