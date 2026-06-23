export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { ProcurementService } from "@/lib/services/procurement.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  const vendors = await ProcurementService.getVendors(ctx.storeId);
  return apiSuccess(vendors);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = vendorSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const vendor = await ProcurementService.createVendor(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(vendor, "Vendor created", 201);
  } catch (err) {
    console.error("[Vendors API Error]", err);
    return apiError("Internal server error", 500);
  }
});

