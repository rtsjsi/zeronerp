/**
 * Recipe Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipeLines, recipes } from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';

export type RecipeLineInput = {
  rawItemId: string;
  quantity: number;
};

export type RecipeInput = {
  name: string;
  finishedItemId: string;
  outputQuantity: number;
  isActive?: boolean;
  lines: RecipeLineInput[];
};

export class RecipeService {
  static async getRecipes(storeId: string) {
    return db().query.recipes.findMany({
      where: and(eq(recipes.storeId, storeId), eq(recipes.isDeleted, false)),
      with: {
        finishedItem: true,
        lines: { with: { rawItem: true } },
      },
      orderBy: desc(recipes.updatedAt),
    });
  }

  static async getRecipeById(storeId: string, id: string) {
    return db().query.recipes.findFirst({
      where: and(eq(recipes.id, id), eq(recipes.storeId, storeId), eq(recipes.isDeleted, false)),
      with: {
        finishedItem: true,
        lines: { with: { rawItem: true } },
      },
    });
  }

  static async createRecipe(storeId: string, userId: string, data: RecipeInput) {
    const database = db();
    const recipeId = newId();

    const [recipe] = await database
      .insert(recipes)
      .values(
        withTimestamps({
          id: recipeId,
          storeId,
          name: data.name.trim(),
          finishedItemId: data.finishedItemId,
          outputQuantity: data.outputQuantity,
          isActive: data.isActive ?? true,
          createdBy: userId,
        }),
      )
      .returning();

    if (data.lines.length > 0) {
      await database.insert(recipeLines).values(
        data.lines.map((line) => ({
          id: newId(),
          storeId,
          recipeId,
          rawItemId: line.rawItemId,
          quantity: line.quantity,
        })),
      );
    }

    return this.getRecipeById(storeId, recipeId) ?? recipe;
  }

  static async updateRecipe(storeId: string, _userId: string, id: string, data: RecipeInput) {
    const database = db();
    const existing = await this.getRecipeById(storeId, id);
    if (!existing) throw new Error('Recipe not found');

    await database
      .update(recipes)
      .set({
        name: data.name.trim(),
        finishedItemId: data.finishedItemId,
        outputQuantity: data.outputQuantity,
        isActive: data.isActive ?? true,
        updatedAt: now(),
      })
      .where(and(eq(recipes.id, id), eq(recipes.storeId, storeId)));

    await database.delete(recipeLines).where(eq(recipeLines.recipeId, id));

    if (data.lines.length > 0) {
      await database.insert(recipeLines).values(
        data.lines.map((line) => ({
          id: newId(),
          storeId,
          recipeId: id,
          rawItemId: line.rawItemId,
          quantity: line.quantity,
        })),
      );
    }

    return this.getRecipeById(storeId, id);
  }

  static async deleteRecipe(storeId: string, _userId: string, id: string) {
    const [recipe] = await db()
      .update(recipes)
      .set({ isDeleted: true, updatedAt: now() })
      .where(and(eq(recipes.id, id), eq(recipes.storeId, storeId)))
      .returning();

    if (!recipe) throw new Error('Recipe not found');
    return recipe;
  }
}
