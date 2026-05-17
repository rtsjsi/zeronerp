export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const invoiceSchema = z.object({
  vendorId: z.string().uuid(),
  invoiceNumber: z.string().min(2),
  financialYear: z.string().min(4),
  notes: z.string().optional(),
  poId: z.string().uuid().optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
});

export const GET = withAuth(async (_req, ctx) => {
  try {
    const invoices = await ProcurementService.getPurchaseInvoices(ctx.tenantId);
    return apiSuccess(invoices);
  } catch (err: any) {
    console.error("[Purchase Invoices GET API Error]", err);
    return apiError(err.message || "Internal server error", 500);
  }
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = invoiceSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const invoice = await ProcurementService.createPurchaseInvoice(ctx.tenantId, ctx.userId, parsed.data);
    return apiSuccess(invoice, "Payable Invoice created and stock updated", 201);
  } catch (err: any) {
    console.error("[Purchase Invoices POST API Error]", err);
    return apiError(err.message || "Internal server error", 400);
  }
});
