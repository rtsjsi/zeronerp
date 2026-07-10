export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { ProductionService } from "@/lib/services/production.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const inputLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const outputLineSchema = z.object({
  recipeId: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than zero"),
  inputs: z.array(inputLineSchema).min(1, "Each finished good needs raw materials"),
});

const declareSchema = z.object({
  recipeId: z.string().optional(),
  batchNumber: z.string().trim().min(1),
  notes: z.string().optional(),
  outputWarehouseId: z.string().min(1),
  inputWarehouseId: z.string().min(1),
  outputs: z.array(outputLineSchema).min(1, "Add at least one finished good line"),
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = declareSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const batch = await ProductionService.declareProduction(
      ctx.storeId,
      ctx.userId,
      parsed.data,
    );

    return apiSuccess(batch, "Production declared and stock updated", 201);
  } catch (err) {
    console.error("[Production Declare API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
