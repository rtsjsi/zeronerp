export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const orderSchema = z.object({
  customerId: z.string().uuid(),
  soNumber: z.string().min(2),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
});

export const GET = withAuth(async (_req, ctx) => {
  const orders = await SalesService.getSalesOrders(ctx.storeId);
  return apiSuccess(orders);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const order = await SalesService.createSalesOrder(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(order, "Sales Order created", 201);
  } catch (err) {
    console.error("[Orders API Error]", err);
    return apiError("Internal server error", 500);
  }
});

