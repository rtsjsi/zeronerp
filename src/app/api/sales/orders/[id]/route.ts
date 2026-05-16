import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const order = await SalesService.updateOrderStatus(
      ctx.tenantId,
      ctx.userId,
      id,
      parsed.data.status
    );

    return apiSuccess(order, "Order status updated");
  } catch (err) {
    console.error("[Order Detail API Error]", err);
    return apiError("Internal server error", 500);
  }
});
