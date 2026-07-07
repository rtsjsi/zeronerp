export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const warehouse = await InventoryService.deleteWarehouse(ctx.storeId, ctx.userId, id);
    return apiSuccess(warehouse, "Warehouse deleted");
  } catch (err) {
    console.error("[Warehouse Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
