export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProductionService } from "@/lib/services/production.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  const batches = await ProductionService.getBatches(ctx.storeId);
  return apiSuccess(batches);
});
