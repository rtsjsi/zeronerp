import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ProductionService } from "@/lib/services/production.service";

export const dynamic = "force-dynamic";

/** 
 * Handle batch actions (START, COMPLETE)
 * Using PATCH to update status
 */
export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const { action } = await req.json();

    let result;
    if (action === 'START') {
      result = await ProductionService.startBatch(ctx.storeId, ctx.userId, id);
    } else if (action === 'COMPLETE') {
      result = await ProductionService.completeBatch(ctx.storeId, ctx.userId, id);
    } else {
      return apiError("Invalid action", 400);
    }

    return apiSuccess(result);
  } catch (error: any) {
    return apiError(error.message, 400);
  }
});
