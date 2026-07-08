export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { DuplicateSkuError, InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { updateItemSchema } from "@/lib/inventory/item-schema";

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      });
      return apiError("Invalid data", 400, fieldErrors);
    }

    const item = await InventoryService.updateItem(ctx.storeId, ctx.userId, id, parsed.data);
    return apiSuccess(item, "Item updated");
  } catch (err) {
    if (err instanceof DuplicateSkuError) {
      return apiError(err.message, 409);
    }
    console.error("[Item Update API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

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
