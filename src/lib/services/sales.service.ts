/**
 * Sales Service (Supabase SDK)
 */

import { db } from '@/lib/db';
import { AuditService } from './audit.service';

export class SalesService {
  /**
   * CUSTOMER CRUD
   */

  static async getCustomers(tenantId: string) {
    const { data } = await db()
      .from('Customer')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('name', { ascending: true });

    return data || [];
  }

  static async createCustomer(tenantId: string, userId: string, data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    customFields?: Record<string, unknown>;
  }) {
    const { data: customer, error } = await db()
      .from('Customer')
      .insert({
        ...data,
        tenantId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Customer', customer.id, 'create', null, customer);
    return customer;
  }

  /**
   * SALES ORDER CRUD
   */

  static async getSalesOrders(tenantId: string) {
    const { data } = await db()
      .from('SalesOrder')
      .select('*, customer:Customer(*), items:SalesOrderItem(*, item:Item(*))')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    return data || [];
  }

  static async createSalesOrder(tenantId: string, userId: string, data: {
    customerId: string;
    soNumber: string;
    notes?: string;
    items: {
      itemId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const { items, ...soData } = data;
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const supaDb = db();

    // 1. Create SO
    const { data: so, error: soErr } = await supaDb
      .from('SalesOrder')
      .insert({
        ...soData,
        tenantId,
        totalAmount,
        createdBy: userId,
      })
      .select()
      .single();

    if (soErr) throw new Error(soErr.message);

    // 2. Create SO Items
    const soItems = items.map(item => ({
      soId: so.id,
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    await supaDb.from('SalesOrderItem').insert(soItems);

    await AuditService.log(tenantId, userId, 'SalesOrder', so.id, 'create', null, so);

    // Return with items
    const { data: fullSo } = await supaDb
      .from('SalesOrder')
      .select('*, items:SalesOrderItem(*)')
      .eq('id', so.id)
      .single();

    return fullSo || so;
  }

  static async updateOrderStatus(tenantId: string, userId: string, id: string, status: string) {
    const supaDb = db();

    const { data: oldSo } = await supaDb
      .from('SalesOrder')
      .select('*, items:SalesOrderItem(*)')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .single();

    if (!oldSo) throw new Error('Sales Order not found');

    const { data: newSo, error } = await supaDb
      .from('SalesOrder')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If order is CONFIRMED, deduct stock
    if (status === 'CONFIRMED' && oldSo.status === 'DRAFT') {
      const { data: warehouse } = await supaDb
        .from('Warehouse')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('isDeleted', false)
        .limit(1)
        .single();

      if (warehouse && oldSo.items) {
        for (const orderItem of oldSo.items) {
          // Check existing stock
          const { data: existingStock } = await supaDb
            .from('Stock')
            .select('*')
            .eq('itemId', orderItem.itemId)
            .eq('warehouseId', warehouse.id)
            .single();

          if (existingStock) {
            await supaDb
              .from('Stock')
              .update({ quantity: Number(existingStock.quantity) - Number(orderItem.quantity) })
              .eq('id', existingStock.id);
          } else {
            await supaDb
              .from('Stock')
              .insert({
                tenantId,
                itemId: orderItem.itemId,
                warehouseId: warehouse.id,
                quantity: -Number(orderItem.quantity),
              });
          }

          // Log the stock transaction
          await supaDb.from('InventoryTransaction').insert({
            tenantId,
            itemId: orderItem.itemId,
            warehouseId: warehouse.id,
            type: 'OUT',
            quantity: -Number(orderItem.quantity),
            reference: `Sales Order ${oldSo.soNumber}`,
            performedBy: userId,
          });
        }
      }
    }

    await AuditService.log(tenantId, userId, 'SalesOrder', id, 'update_status', oldSo, newSo);
    return newSo;
  }
}
