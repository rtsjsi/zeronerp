export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { StockService } from "@/lib/services/stock.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const adjustSchema = z.object({
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number(), // Positive for IN, Negative for OUT
  type: z.enum(["IN", "OUT"]),
  reference: z.string().optional(),
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = adjustSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const result = await StockService.adjustStock(ctx.tenantId, ctx.userId, parsed.data);
    return apiSuccess(result, "Stock adjusted", 200);
  } catch (err) {
    console.error("[Stock Adjust API Error]", err);
    return apiError("Internal server error", 500);
  }
});

