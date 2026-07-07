export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "RECEIVED", "COMPLETED", "CANCELLED"]),
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const order = await ProcurementService.updateOrderStatus(
      ctx.storeId,
      ctx.userId,
      id,
      parsed.data.status,
    );

    return apiSuccess(order, "Order status updated");
  } catch (err) {
    console.error("[Purchase Order Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
