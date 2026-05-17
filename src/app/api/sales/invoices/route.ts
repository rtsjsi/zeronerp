export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  invoiceNumber: z.string().min(2),
  financialYear: z.string().min(4),
  notes: z.string().optional(),
  soId: z.string().uuid().optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
});

export const GET = withAuth(async (_req, ctx) => {
  try {
    const invoices = await SalesService.getSalesInvoices(ctx.tenantId);
    return apiSuccess(invoices);
  } catch (err: any) {
    console.error("[Sales Invoices GET API Error]", err);
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

    const invoice = await SalesService.createSalesInvoice(ctx.tenantId, ctx.userId, parsed.data);
    return apiSuccess(invoice, "Sales Invoice created and stock updated", 201);
  } catch (err: any) {
    console.error("[Sales Invoices POST API Error]", err);
    return apiError(err.message || "Internal server error", 400);
  }
});
