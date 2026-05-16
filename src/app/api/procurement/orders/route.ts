export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const orderSchema = z.object({
  vendorId: z.string().uuid(),
  poNumber: z.string().min(2),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
});

export const GET = withAuth(async (_req, ctx) => {
  const orders = await ProcurementService.getPurchaseOrders(ctx.tenantId);
  return apiSuccess(orders);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const order = await ProcurementService.createPurchaseOrder(ctx.tenantId, ctx.userId, parsed.data);
    return apiSuccess(order, "Purchase Order created", 201);
  } catch (err) {
    console.error("[Orders API Error]", err);
    return apiError("Internal server error", 500);
  }
});

