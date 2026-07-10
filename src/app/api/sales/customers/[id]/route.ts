export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { partnerFormSchema } from "@/lib/partner-schema";

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = partnerFormSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const customer = await SalesService.updateCustomer(
      ctx.storeId,
      ctx.userId,
      id,
      parsed.data,
    );

    return apiSuccess(customer, "Customer updated");
  } catch (err) {
    console.error("[Customer Update API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const customer = await SalesService.deleteCustomer(ctx.storeId, ctx.userId, id);
    return apiSuccess(customer, "Customer deleted");
  } catch (err) {
    console.error("[Customer Detail API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
