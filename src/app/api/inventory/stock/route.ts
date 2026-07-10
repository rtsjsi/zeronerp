export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  const stock = await InventoryService.getStockOverview(ctx.storeId);
  return apiSuccess(stock);
});
