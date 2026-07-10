/**
 * Recipe Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, recipeLines, recipes } from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';

export type RecipeLineInput = {
  rawItemId: string;
  quantity: number;
};

export type RecipeInput = {
  name?: string;
  finishedItemId: string;
  outputQuantity: number;
  isActive?: boolean;
  lines: RecipeLineInput[];
};

async function resolveRecipeName(storeId: string, finishedItemId: string): Promise<string> {
  const item = await db().query.items.findFirst({
    where: and(eq(items.id, finishedItemId), eq(items.storeId, storeId), eq(items.isDeleted, false)),
  });
  if (!item) throw new Error('Finished good not found');
  return item.name;
}

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

  static async getActiveRecipeByFinishedItem(storeId: string, finishedItemId: string) {
    return db().query.recipes.findFirst({
      where: and(
        eq(recipes.storeId, storeId),
        eq(recipes.finishedItemId, finishedItemId),
        eq(recipes.isActive, true),
        eq(recipes.isDeleted, false),
      ),
      with: {
        finishedItem: true,
        lines: { with: { rawItem: true } },
      },
      orderBy: desc(recipes.updatedAt),
    });
  }

  static async createRecipe(storeId: string, userId: string, data: RecipeInput) {
    const database = db();
    const recipeId = newId();
    const name = data.name?.trim() || (await resolveRecipeName(storeId, data.finishedItemId));

    const [recipe] = await database
      .insert(recipes)
      .values(
        withTimestamps({
          id: recipeId,
          storeId,
          name,
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

    const name = data.name?.trim() || (await resolveRecipeName(storeId, data.finishedItemId));

    await database
      .update(recipes)
      .set({
        name,
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
