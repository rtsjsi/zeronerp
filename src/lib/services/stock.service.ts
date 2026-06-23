/**
 * Stock Service (Supabase SDK)
 */

import { db } from '@/lib/db';

export class StockService {
  /**
   * Adjust stock level (Manual IN/OUT)
   */
  static async adjustStock(
    storeId: string,
    userId: string,
    data: {
      itemId: string;
      warehouseId: string;
      quantity: number;
      type: 'IN' | 'OUT';
      reference?: string;
    }
  ) {
    const supaDb = db();

    // 1. Check if stock record exists
    const { data: existing } = await supaDb
      .from('Stock')
      .select('*')
      .eq('itemId', data.itemId)
      .eq('warehouseId', data.warehouseId)
      .single();

    let stock;
    if (existing) {
      const { data: updated, error } = await supaDb
        .from('Stock')
        .update({ quantity: Number(existing.quantity) + data.quantity })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      stock = updated;
    } else {
      const { data: created, error } = await supaDb
        .from('Stock')
        .insert({
          storeId,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      stock = created;
    }

    // 2. Log Transaction
    const { data: transaction, error: txErr } = await supaDb
      .from('InventoryTransaction')
      .insert({
        storeId,
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        type: data.type,
        quantity: data.quantity,
        reference: data.reference || 'Manual Adjustment',
        performedBy: userId,
      })
      .select()
      .single();

    if (txErr) throw new Error(txErr.message);

    

    return { stock, transaction };
  }

  /**
   * Transfer stock between warehouses
   */
  static async transferStock(
    storeId: string,
    userId: string,
    data: {
      itemId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
    }
  ) {
    if (data.quantity <= 0) throw new Error('Quantity must be positive');

    const supaDb = db();

    // 1. Decrease from source
    const { data: sourceStock } = await supaDb
      .from('Stock')
      .select('*')
      .eq('itemId', data.itemId)
      .eq('warehouseId', data.fromWarehouseId)
      .single();

    if (!sourceStock || Number(sourceStock.quantity) < data.quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    await supaDb
      .from('Stock')
      .update({ quantity: Number(sourceStock.quantity) - data.quantity })
      .eq('id', sourceStock.id);

    // 2. Increase at destination
    const { data: destStock } = await supaDb
      .from('Stock')
      .select('*')
      .eq('itemId', data.itemId)
      .eq('warehouseId', data.toWarehouseId)
      .single();

    if (destStock) {
      await supaDb
        .from('Stock')
        .update({ quantity: Number(destStock.quantity) + data.quantity })
        .eq('id', destStock.id);
    } else {
      await supaDb
        .from('Stock')
        .insert({
          storeId,
          itemId: data.itemId,
          warehouseId: data.toWarehouseId,
          quantity: data.quantity,
        });
    }

    // 3. Log Transactions
    await supaDb.from('InventoryTransaction').insert([
      {
        storeId,
        itemId: data.itemId,
        warehouseId: data.fromWarehouseId,
        type: 'OUT',
        quantity: -data.quantity,
        reference: `Transfer to ${data.toWarehouseId}`,
        performedBy: userId,
      },
      {
        storeId,
        itemId: data.itemId,
        warehouseId: data.toWarehouseId,
        type: 'IN',
        quantity: data.quantity,
        reference: `Transfer from ${data.fromWarehouseId}`,
        performedBy: userId,
      },
    ]);

    return { success: true };
  }
}
