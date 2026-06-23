import { db } from '../db';
import { StockService } from './stock.service';

export interface ProductionBatch {
  id: string;
  storeId: string;
  batchNumber: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionMaterial {
  id: string;
  batchId: string;
  itemId: string;
  warehouseId: string;
  type: 'INPUT' | 'OUTPUT';
  quantity: number;
}

export class ProductionService {
  /** Get all batches for a tenant */
  static async getBatches(storeId: string) {
    const { data, error } = await db()
      .from('ProductionBatch')
      .select(`
        *,
        materials:ProductionMaterial(
          *,
          item:Item(name, sku, uom),
          warehouse:Warehouse(name)
        )
      `)
      .eq('storeId', storeId)
      .eq('isDeleted', false)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }

  /** Create a new production batch */
  static async createBatch(storeId: string, userId: string, payload: {
    batchNumber: string;
    notes?: string;
    materials: Omit<ProductionMaterial, 'id' | 'batchId'>[];
  }) {
    const supa = db();

    // 1. Create Batch
    const { data: batch, error: batchErr } = await supa
      .from('ProductionBatch')
      .insert({
        storeId,
        batchNumber: payload.batchNumber,
        notes: payload.notes,
        status: 'DRAFT',
      })
      .select()
      .single();

    if (batchErr) throw batchErr;

    // 2. Add Materials
    if (payload.materials.length > 0) {
      const materials = payload.materials.map(m => ({
        ...m,
        batchId: batch.id,
        storeId,
      }));

      const { error: matErr } = await supa
        .from('ProductionMaterial')
        .insert(materials);

      if (matErr) throw matErr;
    }

    

    return batch;
  }

  /** Start production (change status to IN_PROGRESS) */
  static async startBatch(storeId: string, userId: string, batchId: string) {
    const { data: batch, error } = await db()
      .from('ProductionBatch')
      .update({
        status: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', batchId)
      .eq('storeId', storeId)
      .select()
      .single();

    if (error) throw error;

    

    return batch;
  }

  /** Complete production (Adjust Stocks & Finish) */
  static async completeBatch(storeId: string, userId: string, batchId: string) {
    const supa = db();

    // 1. Get Batch and Materials
    const { data: batch, error: batchErr } = await supa
      .from('ProductionBatch')
      .select('*, materials:ProductionMaterial(*)')
      .eq('id', batchId)
      .eq('storeId', storeId)
      .single();

    if (batchErr) throw batchErr;
    if (batch.status === 'COMPLETED') throw new Error('Batch already completed');

    // 2. Process Stock Adjustments for each material
    // Note: In a real app, this should be a database transaction or a single RPC call.
    // For now, we do it sequentially.
    for (const mat of batch.materials) {
      if (mat.type === 'INPUT') {
        // Consumption: Stock OUT
        await StockService.adjustStock(storeId, userId, {
          itemId: mat.itemId,
          warehouseId: mat.warehouseId,
          type: 'OUT',
          quantity: mat.quantity,
          reference: `Batch ${batch.batchNumber} Consumption`,
        });
      } else {
        // Production: Stock IN
        await StockService.adjustStock(storeId, userId, {
          itemId: mat.itemId,
          warehouseId: mat.warehouseId,
          type: 'IN',
          quantity: mat.quantity,
          reference: `Batch ${batch.batchNumber} Production`,
        });
      }
    }

    // 3. Update Batch Status
    const { data: updatedBatch, error: updateErr } = await supa
      .from('ProductionBatch')
      .update({
        status: 'COMPLETED',
        endTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    

    return updatedBatch;
  }
}
