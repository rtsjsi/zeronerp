export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const vendor = await ProcurementService.deleteVendor(ctx.storeId, ctx.userId, id);
    return apiSuccess(vendor, "Vendor deleted");
  } catch (err) {
    console.error("[Vendor Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
