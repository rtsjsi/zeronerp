/**
 * Production Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  productionBatches,
  productionMaterials,
} from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';
import { StockService } from './stock.service';

export interface ProductionMaterial {
  id: string;
  batchId: string;
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
        materials: {
          with: { item: true, warehouse: true },
        },
      },
      orderBy: desc(productionBatches.createdAt),
    });
  }

  static async createBatch(
    storeId: string,
    userId: string,
    data: {
      batchNumber: string;
      notes?: string;
      materials: Omit<ProductionMaterial, 'id' | 'batchId'>[];
    },
  ) {
    const database = db();
    const batchId = newId();

    const [batch] = await database
      .insert(productionBatches)
      .values(
        withTimestamps({
          id: batchId,
          storeId,
          batchNumber: data.batchNumber,
          notes: data.notes,
          status: 'DRAFT',
          createdBy: userId,
        }),
      )
      .returning();

    if (data.materials.length > 0) {
      await database.insert(productionMaterials).values(
        data.materials.map((material) => ({
          id: newId(),
          storeId,
          batchId,
          itemId: material.itemId,
          warehouseId: material.warehouseId,
          type: material.type,
          quantity: material.quantity,
          createdAt: now(),
        })),
      );
    }

    return (
      (await database.query.productionBatches.findFirst({
        where: eq(productionBatches.id, batchId),
        with: { materials: true },
      })) ?? batch
    );
  }

  static async startBatch(storeId: string, _userId: string, id: string) {
    const [batch] = await db()
      .update(productionBatches)
      .set({
        status: 'IN_PROGRESS',
        startTime: now(),
        updatedAt: now(),
      })
      .where(and(eq(productionBatches.id, id), eq(productionBatches.storeId, storeId)))
      .returning();

    if (!batch) throw new Error('Production batch not found');
    return batch;
  }

  static async completeBatch(storeId: string, userId: string, id: string) {
    const database = db();

    const batch = await database.query.productionBatches.findFirst({
      where: and(eq(productionBatches.id, id), eq(productionBatches.storeId, storeId)),
      with: { materials: true },
    });

    if (!batch) throw new Error('Production batch not found');

    for (const material of batch.materials) {
      const quantity = Number(material.quantity);
      if (material.type === 'INPUT') {
        await StockService.adjustStock(storeId, userId, {
          itemId: material.itemId,
          warehouseId: material.warehouseId,
          quantity: -quantity,
          type: 'OUT',
          reference: `Production Batch ${batch.batchNumber}`,
        });
      } else {
        await StockService.adjustStock(storeId, userId, {
          itemId: material.itemId,
          warehouseId: material.warehouseId,
          quantity,
          type: 'IN',
          reference: `Production Batch ${batch.batchNumber}`,
        });
      }
    }

    const [completed] = await database
      .update(productionBatches)
      .set({
        status: 'COMPLETED',
        endTime: now(),
        updatedAt: now(),
      })
      .where(eq(productionBatches.id, id))
      .returning();

    return completed;
  }
}
