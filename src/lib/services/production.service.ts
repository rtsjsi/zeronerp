/**
 * Production Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  productionBatches,
  productionMaterials,
  productionOutputs,
  stocks,
} from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';
import { StockService } from './stock.service';
import { RecipeService } from './recipe.service';

export type ProductionInputLine = {
  itemId: string;
  quantity: number;
};

export type ProductionOutputLine = {
  finishedItemId: string;
  quantity: number;
  inputs: ProductionInputLine[];
};

export class ProductionService {
  static async getBatches(storeId: string) {
    return db().query.productionBatches.findMany({
      where: and(eq(productionBatches.storeId, storeId), eq(productionBatches.isDeleted, false)),
      with: {
        recipe: { with: { finishedItem: true } },
        outputs: {
          with: {
            recipe: { with: { finishedItem: true } },
            item: true,
            materials: {
              with: { item: true, warehouse: true },
            },
          },
        },
        materials: {
          with: { item: true, warehouse: true, outputLine: true },
        },
      },
      orderBy: desc(productionBatches.createdAt),
    });
  }

  static async declareProduction(
    storeId: string,
    userId: string,
    data: {
      batchNumber: string;
      outputWarehouseId: string;
      inputWarehouseId: string;
      outputs: ProductionOutputLine[];
    },
  ) {
    const database = db();

    if (!data.outputs.length) {
      throw new Error('At least one finished good line is required');
    }

    for (const output of data.outputs) {
      if (output.quantity <= 0) {
        throw new Error('All output quantities must be greater than zero');
      }
      if (!output.inputs.length) {
        throw new Error('Each finished good line needs at least one raw material');
      }
      for (const input of output.inputs) {
        if (input.quantity <= 0) {
          throw new Error('All raw material quantities must be greater than zero');
        }
      }
    }

    const aggregatedInputs = new Map<string, { itemId: string; warehouseId: string; quantity: number }>();
    for (const output of data.outputs) {
      for (const input of output.inputs) {
        const key = `${input.itemId}:${data.inputWarehouseId}`;
        const existing = aggregatedInputs.get(key);
        if (existing) {
          existing.quantity += input.quantity;
        } else {
          aggregatedInputs.set(key, {
            itemId: input.itemId,
            warehouseId: data.inputWarehouseId,
            quantity: input.quantity,
          });
        }
      }
    }

    for (const input of aggregatedInputs.values()) {
      const stock = await database.query.stocks.findFirst({
        where: and(eq(stocks.itemId, input.itemId), eq(stocks.warehouseId, input.warehouseId)),
      });
      const available = Number(stock?.quantity ?? 0);
      if (available < input.quantity) {
        throw new Error(`Insufficient stock for raw material (available: ${available})`);
      }
    }

    const batchId = newId();
    const ts = now();

    const singleRecipe =
      data.outputs.length === 1
        ? await RecipeService.getActiveRecipeByFinishedItem(storeId, data.outputs[0].finishedItemId)
        : null;

    const [batch] = await database
      .insert(productionBatches)
      .values(
        withTimestamps({
          id: batchId,
          storeId,
          recipeId: singleRecipe?.id ?? null,
          batchNumber: data.batchNumber.trim(),
          status: 'COMPLETED',
          startTime: ts,
          endTime: ts,
          createdBy: userId,
          createdAt: ts,
          updatedAt: ts,
        }),
      )
      .returning();

    const reference = `Production ${data.batchNumber.trim()}`;
    const materialRows: Array<typeof productionMaterials.$inferInsert> = [];

    for (const output of data.outputs) {
      const recipe = await RecipeService.getActiveRecipeByFinishedItem(storeId, output.finishedItemId);
      if (!recipe) {
        throw new Error('No active recipe found for the selected finished good');
      }

      const outputLineId = newId();

      await database.insert(productionOutputs).values({
        id: outputLineId,
        storeId,
        batchId,
        recipeId: recipe.id,
        itemId: recipe.finishedItemId,
        warehouseId: data.outputWarehouseId,
        quantity: output.quantity,
        createdAt: ts,
      });

      materialRows.push({
        id: newId(),
        storeId,
        batchId,
        outputLineId,
        itemId: recipe.finishedItemId,
        warehouseId: data.outputWarehouseId,
        type: 'OUTPUT',
        quantity: output.quantity,
        createdAt: ts,
      });

      for (const input of output.inputs) {
        materialRows.push({
          id: newId(),
          storeId,
          batchId,
          outputLineId,
          itemId: input.itemId,
          warehouseId: data.inputWarehouseId,
          type: 'INPUT',
          quantity: input.quantity,
          createdAt: ts,
        });
      }
    }

    await database.insert(productionMaterials).values(materialRows);

    for (const input of aggregatedInputs.values()) {
      await StockService.adjustStock(storeId, userId, {
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        quantity: -input.quantity,
        type: 'OUT',
        reference,
      });
    }

    for (const output of data.outputs) {
      const recipe = await RecipeService.getActiveRecipeByFinishedItem(storeId, output.finishedItemId);
      if (!recipe) continue;

      await StockService.adjustStock(storeId, userId, {
        itemId: recipe.finishedItemId,
        warehouseId: data.outputWarehouseId,
        quantity: output.quantity,
        type: 'IN',
        reference,
      });
    }

    return (
      (await database.query.productionBatches.findFirst({
        where: eq(productionBatches.id, batchId),
        with: {
          recipe: { with: { finishedItem: true } },
          outputs: {
            with: {
              recipe: { with: { finishedItem: true } },
              item: true,
              materials: { with: { item: true, warehouse: true } },
            },
          },
          materials: { with: { item: true, warehouse: true, outputLine: true } },
        },
      })) ?? batch
    );
  }
}
