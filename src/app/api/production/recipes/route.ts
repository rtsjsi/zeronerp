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
  name: z.string().trim().min(2).optional(),
  finishedItemId: z.string().min(1),
  outputQuantity: z.number().positive("Output quantity must be greater than zero"),
  isActive: z.boolean().optional(),
  lines: z.array(recipeLineSchema).min(1, "At least one raw material is required"),
});

export const GET = withAuth(async (_req, ctx) => {
  const recipes = await RecipeService.getRecipes(ctx.storeId);
  return apiSuccess(recipes);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = recipeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400, parsed.error.flatten().fieldErrors);
    }

    const recipe = await RecipeService.createRecipe(ctx.storeId, ctx.userId, parsed.data);
    return apiSuccess(recipe, "Recipe created", 201);
  } catch (err) {
    console.error("[Recipes API Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
