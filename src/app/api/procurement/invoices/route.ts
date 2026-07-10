export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const invoiceSchema = z.object({
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
    const invoices = await ProcurementService.getPurchaseInvoices(ctx.storeId);
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

    const invoice = await ProcurementService.createPurchaseInvoice(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(invoice, "Payable Invoice created and stock updated", 201);
  } catch (err: any) {
    console.error("[Purchase Invoices POST API Error]", err);
    return apiError(err.message || "Internal server error", 400);
  }
});
