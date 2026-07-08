/**
 * Production Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  productionBatches,
  productionMaterials,
  stocks,
} from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';
import { StockService } from './stock.service';

export interface ProductionMaterialInput {
  itemId: string;
  warehouseId: string;
  type: 'INPUT' | 'OUTPUT';
  quantity: number;
}

export class ProductionService {
  static async getBatches(storeId: string) {
    return db().query.productionBatches.findMany({
      where: and(eq(productionBatches.storeId, storeId), eq(productionBatches.isDeleted, false)),
      with: {
        recipe: { with: { finishedItem: true } },
        materials: {
          with: { item: true, warehouse: true },
        },
      },
      orderBy: desc(productionBatches.createdAt),
    });
  }

  static async declareProduction(
    storeId: string,
    userId: string,
    data: {
      recipeId?: string;
      batchNumber: string;
      notes?: string;
      materials: ProductionMaterialInput[];
    },
  ) {
    const database = db();

    if (!data.materials.length) {
      throw new Error('At least one material line is required');
    }

    const outputs = data.materials.filter((m) => m.type === 'OUTPUT');
    const inputs = data.materials.filter((m) => m.type === 'INPUT');

    if (!outputs.length) throw new Error('At least one finished good output is required');
    if (!inputs.length) throw new Error('At least one raw material input is required');

    for (const material of data.materials) {
      if (material.quantity <= 0) {
        throw new Error('All quantities must be greater than zero');
      }
    }

    for (const input of inputs) {
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

    const [batch] = await database
      .insert(productionBatches)
      .values(
        withTimestamps({
          id: batchId,
          storeId,
          recipeId: data.recipeId ?? null,
          batchNumber: data.batchNumber.trim(),
          notes: data.notes?.trim() || null,
          status: 'COMPLETED',
          startTime: ts,
          endTime: ts,
          createdBy: userId,
          createdAt: ts,
          updatedAt: ts,
        }),
      )
      .returning();

    await database.insert(productionMaterials).values(
      data.materials.map((material) => ({
        id: newId(),
        storeId,
        batchId,
        itemId: material.itemId,
        warehouseId: material.warehouseId,
        type: material.type,
        quantity: material.quantity,
        createdAt: ts,
      })),
    );

    const reference = `Production ${data.batchNumber.trim()}`;

    for (const material of inputs) {
      await StockService.adjustStock(storeId, userId, {
        itemId: material.itemId,
        warehouseId: material.warehouseId,
        quantity: -material.quantity,
        type: 'OUT',
        reference,
      });
    }

    for (const material of outputs) {
      await StockService.adjustStock(storeId, userId, {
        itemId: material.itemId,
        warehouseId: material.warehouseId,
        quantity: material.quantity,
        type: 'IN',
        reference,
      });
    }

    return (
      (await database.query.productionBatches.findFirst({
        where: eq(productionBatches.id, batchId),
        with: {
          recipe: { with: { finishedItem: true } },
          materials: { with: { item: true, warehouse: true } },
        },
      })) ?? batch
    );
  }
}
