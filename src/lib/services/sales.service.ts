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

  /**
   * SALES INVOICE CRUD
   */

  static async getSalesInvoices(tenantId: string) {
    const { data } = await db()
      .from('SalesInvoice')
      .select('*, customer:Customer(*), items:SalesInvoiceItem(*, item:Item(*), warehouse:Warehouse(*))')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    return data || [];
  }

  static async getOrCreateWalkInCustomer(tenantId: string, userId: string) {
    const supaDb = db();
    const { data: customer } = await supaDb
      .from('Customer')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('name', 'Walk-in Customer')
      .eq('isDeleted', false)
      .maybeSingle();

    if (customer) return customer;

    const { data: newCustomer, error } = await supaDb
      .from('Customer')
      .insert({
        tenantId,
        name: 'Walk-in Customer',
        contactName: 'Retail Buyer',
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to seed Walk-in Customer: ${error.message}`);
    return newCustomer;
  }

  static async createSalesInvoice(tenantId: string, userId: string, data: {
    customerId?: string;
    invoiceNumber: string;
    financialYear: string;
    notes?: string;
    soId?: string | null;
    paymentMethod?: string;
    amountReceived?: number;
    amountReturned?: number;
    items: {
      itemId: string;
      warehouseId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const supaDb = db();

    // 1. Resolve or create Walk-in Customer
    let customerId = data.customerId;
    if (!customerId || customerId === 'walkin') {
      const walkIn = await this.getOrCreateWalkInCustomer(tenantId, userId);
      customerId = walkIn.id;
    }

    // 2. Check for duplicates
    const { data: existing } = await supaDb
      .from('SalesInvoice')
      .select('id')
      .eq('tenantId', tenantId)
      .eq('invoiceNumber', data.invoiceNumber)
      .eq('financialYear', data.financialYear)
      .eq('isDeleted', false)
      .maybeSingle();

    if (existing) {
      throw new Error("Duplicate Sales Invoice number is not allowed in the same financial year.");
    }

    const { items, soId, customerId: oldCustomerId, ...invData } = data;
    const totalAmount = Number(items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2));

    // 3. Insert invoice
    const { data: invoice, error: invErr } = await supaDb
      .from('SalesInvoice')
      .insert({
        ...invData,
        customerId,
        tenantId,
        totalAmount,
        soId: soId || null,
        status: 'COMPLETED',
        paymentMethod: data.paymentMethod || 'CASH',
        amountReceived: data.amountReceived !== undefined ? data.amountReceived : totalAmount,
        amountReturned: data.amountReturned !== undefined ? data.amountReturned : 0,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (invErr) {
      console.error("[SalesService] Invoice Insert Error:", invErr);
      throw new Error(`Failed to create Sales Invoice: ${invErr.message}`);
    }

    // 3. Create items
    const invItems = items.map(item => ({
      invoiceId: invoice.id,
      itemId: item.itemId,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));

    const { error: itemErr } = await supaDb.from('SalesInvoiceItem').insert(invItems);

    if (itemErr) {
      console.error("[SalesService] Invoice Items Insert Error:", itemErr);
      await supaDb.from('SalesInvoice').delete().eq('id', invoice.id);
      throw new Error(`Failed to add items to Sales Invoice: ${itemErr.message}`);
    }

    // 4. Update Stock & Log transactions
    for (const item of items) {
      const { data: existingStock } = await supaDb
        .from('Stock')
        .select('*')
        .eq('itemId', item.itemId)
        .eq('warehouseId', item.warehouseId)
        .maybeSingle();

      if (existingStock) {
        const { error: stockErr } = await supaDb
          .from('Stock')
          .update({ quantity: Number(existingStock.quantity) - Number(item.quantity) })
          .eq('id', existingStock.id);
        if (stockErr) console.error("Stock update error:", stockErr);
      } else {
        const { error: stockErr } = await supaDb
          .from('Stock')
          .insert({
            tenantId,
            itemId: item.itemId,
            warehouseId: item.warehouseId,
            quantity: -Number(item.quantity),
          });
        if (stockErr) console.error("Stock insert error:", stockErr);
      }

      await supaDb.from('InventoryTransaction').insert({
        tenantId,
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        type: 'OUT',
        quantity: -Number(item.quantity),
        reference: `Sales Invoice ${data.invoiceNumber}`,
        performedBy: userId,
        createdAt: new Date().toISOString(),
      });
    }

    // 5. Update SO status if linked
    if (soId) {
      await supaDb
        .from('SalesOrder')
        .update({ status: 'COMPLETED' })
        .eq('id', soId);
    }

    await AuditService.log(tenantId, userId, 'SalesInvoice', invoice.id, 'create', null, invoice);

    return invoice;
  }
}
