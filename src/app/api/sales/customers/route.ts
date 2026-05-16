export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { SalesService } from "@/lib/services/sales.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  const customers = await SalesService.getCustomers(ctx.tenantId);
  return apiSuccess(customers);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const customer = await SalesService.createCustomer(ctx.tenantId, ctx.userId, parsed.data);
    return apiSuccess(customer, "Customer created", 201);
  } catch (err) {
    console.error("[Customers API Error]", err);
    return apiError("Internal server error", 500);
  }
});

