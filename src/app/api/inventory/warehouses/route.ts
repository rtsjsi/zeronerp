export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const warehouseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  location: z.string().optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  const warehouses = await InventoryService.getWarehouses(ctx.storeId);
  return apiSuccess(warehouses);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = warehouseSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const warehouse = await InventoryService.createWarehouse(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(warehouse, "Warehouse created", 201);
  } catch (err) {
    console.error("[Warehouses API Error]", err);
    return apiError("Internal server error", 500);
  }
});

