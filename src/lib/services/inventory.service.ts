/**
 * Inventory Service (Supabase SDK)
 */

import { db } from '@/lib/db';
import { AuditService } from './audit.service';

export class InventoryService {
  /**
   * ITEM CRUD
   */

  static async getItems(tenantId: string) {
    const { data: items } = await db()
      .from('Item')
      .select('*, stocks:Stock(*, warehouse:Warehouse(*))')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('updatedAt', { ascending: false });

    return items || [];
  }

  static async getItemById(tenantId: string, id: string) {
    const { data } = await db()
      .from('Item')
      .select('*, stocks:Stock(*, warehouse:Warehouse(*))')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .single();

    return data;
  }

  static async createItem(tenantId: string, userId: string, data: {
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
        tenantId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Item', item.id, 'create', null, item);
    return item;
  }

  static async updateItem(tenantId: string, userId: string, id: string, updateData: any) {
    const oldItem = await this.getItemById(tenantId, id);
    if (!oldItem) throw new Error('Item not found');

    const { data: newItem, error } = await db()
      .from('Item')
      .update(updateData)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Item', id, 'update', oldItem, newItem);
    return newItem;
  }

  static async deleteItem(tenantId: string, userId: string, id: string) {
    const { data: item, error } = await db()
      .from('Item')
      .update({ isDeleted: true })
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Item', id, 'delete', item, null);
    return item;
  }

  /**
   * WAREHOUSE CRUD
   */

  static async getWarehouses(tenantId: string) {
    const { data } = await db()
      .from('Warehouse')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('name', { ascending: true });

    return data || [];
  }

  static async createWarehouse(tenantId: string, userId: string, data: {
    name: string;
    code: string;
    location?: string;
  }) {
    const { data: warehouse, error } = await db()
      .from('Warehouse')
      .insert({
        ...data,
        tenantId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Warehouse', warehouse.id, 'create', null, warehouse);
    return warehouse;
  }
}
