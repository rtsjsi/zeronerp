export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const customer = await SalesService.deleteCustomer(ctx.storeId, ctx.userId, id);
    return apiSuccess(customer, "Customer deleted");
  } catch (err) {
    console.error("[Customer Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
