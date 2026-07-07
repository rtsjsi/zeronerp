/**
 * Inventory Service (Supabase SDK)
 */

import { db } from '@/lib/db';

export class InventoryService {
  /**
   * ITEM CRUD
   */

  static async getItems(storeId: string) {
    const { data: items } = await db()
      .from('Item')
      .select('*, stocks:Stock(*, warehouse:Warehouse(*))')
      .eq('storeId', storeId)
      .eq('isDeleted', false)
      .order('updatedAt', { ascending: false });

    return items || [];
  }

  static async getItemById(storeId: string, id: string) {
    const { data } = await db()
      .from('Item')
      .select('*, stocks:Stock(*, warehouse:Warehouse(*))')
      .eq('id', id)
      .eq('storeId', storeId)
      .eq('isDeleted', false)
      .single();

    return data;
  }

  static async createItem(storeId: string, userId: string, data: {
    sku: string;
    name: string;
    description?: string;
    uom?: string;
    basePrice?: number;
  }) {
    const { data: item, error } = await db()
      .from('Item')
      .insert({
        ...data,
        storeId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    
    return item;
  }

  static async updateItem(storeId: string, userId: string, id: string, updateData: any) {
    const oldItem = await this.getItemById(storeId, id);
    if (!oldItem) throw new Error('Item not found');

    const { data: newItem, error } = await db()
      .from('Item')
      .update(updateData)
      .eq('id', id)
      .eq('storeId', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    
    return newItem;
  }

  static async deleteItem(storeId: string, userId: string, id: string) {
    const { data: item, error } = await db()
      .from('Item')
      .update({ isDeleted: true })
      .eq('id', id)
      .eq('storeId', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    
    return item;
  }

  /**
   * WAREHOUSE CRUD
   */

  static async getWarehouses(storeId: string) {
    const { data } = await db()
      .from('Warehouse')
      .select('*')
      .eq('storeId', storeId)
      .eq('isDeleted', false)
      .order('name', { ascending: true });

    return data || [];
  }

  static async createWarehouse(storeId: string, userId: string, data: {
    name: string;
    code: string;
    location?: string;
  }) {
    const { data: warehouse, error } = await db()
      .from('Warehouse')
      .insert({
        ...data,
        storeId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    
    return warehouse;
  }

  static async deleteWarehouse(storeId: string, userId: string, id: string) {
    const { data: warehouse, error } = await db()
      .from('Warehouse')
      .update({ isDeleted: true })
      .eq('id', id)
      .eq('storeId', storeId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return warehouse;
  }
}
