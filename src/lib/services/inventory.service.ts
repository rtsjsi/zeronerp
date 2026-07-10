/**
 * Inventory Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, warehouses } from '@/db/schema';
import { newId, now, withTimestamps } from '@/db/helpers';
import { normalizeUomCode } from '@/lib/inventory/constants';

export type ItemInput = {
  name: string;
  description?: string;
  category?: string;
  itemType?: string;
  uom?: string;
  hsnSacCode?: string;
  gstRate?: number;
  reorderLevel?: number;
  minStock?: number;
  cost?: number;
  mrp?: number;
  isActive?: boolean;
};

function normalizeItemInput(data: ItemInput) {
  return {
    ...data,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    hsnSacCode: data.hsnSacCode?.trim() || null,
    ...(data.uom !== undefined ? { uom: normalizeUomCode(data.uom) } : {}),
  };
}

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

  static async createItem(storeId: string, userId: string, data: ItemInput) {
    const normalized = normalizeItemInput(data);

    const [item] = await db()
      .insert(items)
      .values(
        withTimestamps({
          id: newId(),
          category: 'RAW_MATERIAL',
          itemType: 'STOCKABLE',
          gstRate: 0,
          reorderLevel: 0,
          minStock: 0,
          cost: 0,
          mrp: 0,
          isActive: true,
          ...normalized,
          storeId,
          createdBy: userId,
        }),
      )
      .returning();

    return item;
  }

  static async updateItem(storeId: string, _userId: string, id: string, data: Partial<ItemInput>) {
    const oldItem = await this.getItemById(storeId, id);
    if (!oldItem) throw new Error('Item not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }
    if (data.hsnSacCode !== undefined) {
      updateData.hsnSacCode = data.hsnSacCode?.trim() || null;
    }
    if (data.uom !== undefined) {
      updateData.uom = normalizeUomCode(data.uom);
    }

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

  static async updateWarehouse(
    storeId: string,
    _userId: string,
    id: string,
    data: { name: string; location?: string },
  ) {
    const [warehouse] = await db()
      .update(warehouses)
      .set({
        name: data.name,
        location: data.location && data.location.trim().length > 0 ? data.location : null,
        updatedAt: now(),
      })
      .where(and(eq(warehouses.id, id), eq(warehouses.storeId, storeId), eq(warehouses.isDeleted, false)))
      .returning();

    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
  }
}
