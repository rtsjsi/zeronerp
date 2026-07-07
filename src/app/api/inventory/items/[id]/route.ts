export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const item = await InventoryService.deleteItem(ctx.storeId, ctx.userId, id);
    return apiSuccess(item, "Item deleted");
  } catch (err) {
    console.error("[Item Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
