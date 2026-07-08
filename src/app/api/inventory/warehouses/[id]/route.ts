export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = warehouseSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const warehouse = await InventoryService.updateWarehouse(
      ctx.storeId,
      ctx.userId,
      id,
      parsed.data,
    );

    return apiSuccess(warehouse, "Warehouse updated");
  } catch (err) {
    console.error("[Warehouse Update API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

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
