export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { StockService } from "@/lib/services/stock.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const transferSchema = z.object({
  itemId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const result = await StockService.transferStock(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(result, "Stock transferred", 200);
  } catch (err) {
    console.error("[Stock Transfer API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

