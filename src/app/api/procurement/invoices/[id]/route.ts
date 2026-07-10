export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const invoiceUpdateSchema = z.object({
  vendorId: z.string().min(1, "Please select a supplier"),
  invoiceNumber: z.string().min(2, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  financialYear: z.string().min(4, "Financial year is required"),
  items: z.array(z.object({
    itemId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    gstRate: z.number().min(0).max(100),
  })).min(1),
});

export const GET = withAuth(async (_req, ctx) => {
  try {
    const { id } = ctx.params;
    const invoice = await ProcurementService.getPurchaseInvoiceById(ctx.storeId, id);

    if (!invoice) {
      return apiError("Payable Invoice not found", 404);
    }

    return apiSuccess(invoice);
  } catch (err) {
    console.error("[Purchase Invoice GET API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const { id } = ctx.params;
    const body = await req.json();
    const parsed = invoiceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const invoice = await ProcurementService.updatePurchaseInvoice(
      ctx.storeId,
      ctx.userId,
      id,
      parsed.data,
    );

    return apiSuccess(invoice, "Payable Invoice updated and stock adjusted");
  } catch (err) {
    console.error("[Purchase Invoice PATCH API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 400);
  }
});
