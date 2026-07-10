export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { RecipeService } from "@/lib/services/recipe.service";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const recipeLineSchema = z.object({
  rawItemId: z.string().min(1),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

const recipeSchema = z.object({
  name: z.string().trim().min(2),
  finishedItemId: z.string().min(1),
  outputQuantity: z.number().positive("Output quantity must be greater than zero"),
  isActive: z.boolean().optional(),
  lines: z.array(recipeLineSchema).min(1, "At least one raw material is required"),
});

export const GET = withAuth(async (_req, ctx) => {
  const recipe = await RecipeService.getRecipeById(ctx.storeId, ctx.params.id);
  if (!recipe) return apiError("Recipe not found", 404);
  return apiSuccess(recipe);
});

export const PATCH = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = recipeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const recipe = await RecipeService.updateRecipe(
      ctx.storeId,
      ctx.userId,
      ctx.params.id,
      parsed.data,
    );
    return apiSuccess(recipe, "Recipe updated");
  } catch (err) {
    console.error("[Recipe Update API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

export const DELETE = withAuth(async (_req, ctx) => {
  try {
    const recipe = await RecipeService.deleteRecipe(ctx.storeId, ctx.userId, ctx.params.id);
    return apiSuccess(recipe, "Recipe deleted");
  } catch (err) {
    console.error("[Recipe Delete API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
