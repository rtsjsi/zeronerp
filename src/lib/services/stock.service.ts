/**
 * Stock Service (Cloudflare D1 / Drizzle)
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { inventoryTransactions, stocks } from '@/db/schema';
import { newId, now } from '@/db/helpers';

export class StockService {
  static async adjustStock(
    storeId: string,
    userId: string,
    data: {
      itemId: string;
      warehouseId: string;
      quantity: number;
      type: 'IN' | 'OUT';
      reference?: string;
    },
  ) {
    const database = db();

    const existing = await database.query.stocks.findFirst({
      where: and(eq(stocks.itemId, data.itemId), eq(stocks.warehouseId, data.warehouseId)),
    });

    let stock;
    if (existing) {
      [stock] = await database
        .update(stocks)
        .set({
          quantity: Number(existing.quantity) + data.quantity,
          updatedAt: now(),
        })
        .where(eq(stocks.id, existing.id))
        .returning();
    } else {
      [stock] = await database
        .insert(stocks)
        .values({
          id: newId(),
          storeId,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          updatedAt: now(),
        })
        .returning();
    }

    const [transaction] = await database
      .insert(inventoryTransactions)
      .values({
        id: newId(),
        storeId,
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        reference: data.reference || 'Manual Adjustment',
        performedBy: userId,
        createdAt: now(),
      })
      .returning();

    return { stock, transaction };
  }

  static async transferStock(
    storeId: string,
    userId: string,
    data: {
      itemId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
    },
  ) {
    if (data.quantity <= 0) throw new Error('Quantity must be positive');

    const database = db();

    const sourceStock = await database.query.stocks.findFirst({
      where: and(eq(stocks.itemId, data.itemId), eq(stocks.warehouseId, data.fromWarehouseId)),
    });

    if (!sourceStock || Number(sourceStock.quantity) < data.quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    await database
      .update(stocks)
      .set({
        quantity: Number(sourceStock.quantity) - data.quantity,
        updatedAt: now(),
      })
      .where(eq(stocks.id, sourceStock.id));

    const destStock = await database.query.stocks.findFirst({
      where: and(eq(stocks.itemId, data.itemId), eq(stocks.warehouseId, data.toWarehouseId)),
    });

    if (destStock) {
      await database
        .update(stocks)
        .set({
          quantity: Number(destStock.quantity) + data.quantity,
          updatedAt: now(),
        })
        .where(eq(stocks.id, destStock.id));
    } else {
      await database.insert(stocks).values({
        id: newId(),
        storeId,
        itemId: data.itemId,
        warehouseId: data.toWarehouseId,
        quantity: data.quantity,
        updatedAt: now(),
      });
    }

    const ts = now();
    await database.insert(inventoryTransactions).values([
      {
        id: newId(),
        storeId,
        itemId: data.itemId,
        warehouseId: data.fromWarehouseId,
        type: 'OUT',
        quantity: -data.quantity,
        reference: `Transfer to ${data.toWarehouseId}`,
        performedBy: userId,
        createdAt: ts,
      },
      {
        id: newId(),
        storeId,
        itemId: data.itemId,
        warehouseId: data.toWarehouseId,
        type: 'IN',
        quantity: data.quantity,
        reference: `Transfer from ${data.fromWarehouseId}`,
        performedBy: userId,
        createdAt: ts,
      },
    ]);

    return { success: true };
  }
}
