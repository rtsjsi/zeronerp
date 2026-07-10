export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { partnerFormSchema } from "@/lib/partner-schema";

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = partnerFormSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const vendor = await ProcurementService.updateVendor(
      ctx.storeId,
      ctx.userId,
      id,
      parsed.data,
    );

    return apiSuccess(vendor, "Vendor updated");
  } catch (err) {
    console.error("[Vendor Update API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

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
