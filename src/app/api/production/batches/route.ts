import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { apiSuccess, apiError } from "@/lib/api-response";
import { ProductionService } from "@/lib/services/production.service";

export const dynamic = "force-dynamic";

/** Get all batches */
export const GET = withAuth(async (req, ctx) => {
  try {
    const batches = await ProductionService.getBatches(ctx.tenantId);
    return apiSuccess(batches);
  } catch (error: any) {
    return apiError(error.message, 500);
  }
});

/** Create a batch */
export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const batch = await ProductionService.createBatch(ctx.tenantId, ctx.userId, body);
    return apiSuccess(batch, "Batch created", 201);
  } catch (error: any) {
    return apiError(error.message, 400);
  }
});
