export const dynamic = "force-dynamic";

import { apiSuccess } from '@/lib/api-response';

export async function POST() {
  return apiSuccess(null, 'Signed out');
}
