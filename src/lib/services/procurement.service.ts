/**
 * Procurement Service (Supabase SDK)
 */

import { db } from '@/lib/db';
import { AuditService } from './audit.service';

export class ProcurementService {
  /**
   * VENDOR CRUD
   */

  static async getVendors(tenantId: string) {
    const { data } = await db()
      .from('Vendor')
      .select('*')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('name', { ascending: true });

    return data || [];
  }

  static async createVendor(tenantId: string, userId: string, data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    customFields?: Record<string, unknown>;
  }) {
    const { data: vendor, error } = await db()
      .from('Vendor')
      .insert({
        ...data,
        tenantId,
        createdBy: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'Vendor', vendor.id, 'create', null, vendor);
    return vendor;
  }

  /**
   * PURCHASE ORDER CRUD
   */

  static async getPurchaseOrders(tenantId: string) {
    const { data } = await db()
      .from('PurchaseOrder')
      .select('*, vendor:Vendor(*), items:PurchaseOrderItem(*, item:Item(*))')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    return data || [];
  }

  static async createPurchaseOrder(tenantId: string, userId: string, data: {
    vendorId: string;
    poNumber: string;
    notes?: string;
    items: {
      itemId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const { items, ...poData } = data;
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const supaDb = db();

    // 1. Create PO
    const { data: po, error: poErr } = await supaDb
      .from('PurchaseOrder')
      .insert({
        ...poData,
        tenantId,
        totalAmount,
        createdBy: userId,
      })
      .select()
      .single();

    if (poErr) throw new Error(poErr.message);

    // 2. Create PO Items
    const poItems = items.map(item => ({
      poId: po.id,
      itemId: item.itemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    await supaDb.from('PurchaseOrderItem').insert(poItems);

    await AuditService.log(tenantId, userId, 'PurchaseOrder', po.id, 'create', null, po);

    // Return with items
    const { data: fullPo } = await supaDb
      .from('PurchaseOrder')
      .select('*, items:PurchaseOrderItem(*)')
      .eq('id', po.id)
      .single();

    return fullPo || po;
  }

  static async updateOrderStatus(tenantId: string, userId: string, id: string, status: string) {
    const supaDb = db();

    const { data: oldPo } = await supaDb
      .from('PurchaseOrder')
      .select('*')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .single();

    if (!oldPo) throw new Error('Purchase Order not found');

    const { data: newPo, error } = await supaDb
      .from('PurchaseOrder')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await AuditService.log(tenantId, userId, 'PurchaseOrder', id, 'update_status', oldPo, newPo);
    return newPo;
  }
}
