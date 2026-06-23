export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const itemSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  uom: z.string().optional(),
  basePrice: z.number().optional(),
});

export const GET = withAuth(async (_req, ctx) => {
  const items = await InventoryService.getItems(ctx.storeId);
  return apiSuccess(items);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = itemSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      });
      return apiError("Invalid data", 400, fieldErrors);
    }

    const item = await InventoryService.createItem(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(item, "Item created", 201);
  } catch (err) {
    console.error("[Items API Error]", err);
    return apiError("Internal server error", 500);
  }
});

