/**
 * Inventory Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, warehouses } from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';

export class InventoryService {
  static async getItems(storeId: string) {
    return db().query.items.findMany({
      where: and(eq(items.storeId, storeId), eq(items.isDeleted, false)),
      with: {
        stocks: {
          with: { warehouse: true },
        },
      },
      orderBy: desc(items.updatedAt),
    });
  }

  static async getItemById(storeId: string, id: string) {
    return db().query.items.findFirst({
      where: and(eq(items.id, id), eq(items.storeId, storeId), eq(items.isDeleted, false)),
      with: {
        stocks: {
          with: { warehouse: true },
        },
      },
    });
  }

  static async createItem(
    storeId: string,
    userId: string,
    data: {
      sku: string;
      name: string;
      description?: string;
      uom?: string;
      basePrice?: number;
    },
  ) {
    const [item] = await db()
      .insert(items)
      .values(
        withTimestamps({
          id: newId(),
          ...data,
          storeId,
          createdBy: userId,
        }),
      )
      .returning();

    return item;
  }

  static async updateItem(storeId: string, _userId: string, id: string, updateData: Record<string, unknown>) {
    const oldItem = await this.getItemById(storeId, id);
    if (!oldItem) throw new Error('Item not found');

    const [newItem] = await db()
      .update(items)
      .set({ ...updateData, updatedAt: now() })
      .where(and(eq(items.id, id), eq(items.storeId, storeId)))
      .returning();

    return newItem;
  }

  static async deleteItem(storeId: string, _userId: string, id: string) {
    const [item] = await db()
      .update(items)
      .set({ isDeleted: true, updatedAt: now() })
      .where(and(eq(items.id, id), eq(items.storeId, storeId)))
      .returning();

    if (!item) throw new Error('Item not found');
    return item;
  }

  static async getWarehouses(storeId: string) {
    return db().query.warehouses.findMany({
      where: and(eq(warehouses.storeId, storeId), eq(warehouses.isDeleted, false)),
      orderBy: warehouses.name,
    });
  }

  static async createWarehouse(
    storeId: string,
    userId: string,
    data: {
      name: string;
      code: string;
      location?: string;
    },
  ) {
    const [warehouse] = await db()
      .insert(warehouses)
      .values(
        withTimestamps({
          id: newId(),
          ...data,
          storeId,
          createdBy: userId,
        }),
      )
      .returning();

    return warehouse;
  }

  static async deleteWarehouse(storeId: string, _userId: string, id: string) {
    const [warehouse] = await db()
      .update(warehouses)
      .set({ isDeleted: true, updatedAt: now() })
      .where(and(eq(warehouses.id, id), eq(warehouses.storeId, storeId)))
      .returning();

    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
  }
}
