/**
 * Procurement Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  inventoryTransactions,
  purchaseInvoiceItems,
  purchaseInvoices,
  purchaseOrderItems,
  purchaseOrders,
  stocks,
  vendors,
} from '@/db/schema';
import { newId, now, toJson, withTimestamps } from '@/db/helpers';

export class ProcurementService {
  static async getVendors(storeId: string) {
    return db().query.vendors.findMany({
      where: and(eq(vendors.storeId, storeId), eq(vendors.isDeleted, false)),
      orderBy: vendors.name,
    });
  }

  static async createVendor(
    storeId: string,
    userId: string,
    data: {
      name: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      customFields?: Record<string, unknown>;
    },
  ) {
    const [vendor] = await db()
      .insert(vendors)
      .values(
        withTimestamps({
          id: newId(),
          ...data,
          customFields: toJson(data.customFields),
          storeId,
          createdBy: userId,
        }),
      )
      .returning();

    return vendor;
  }

  static async deleteVendor(storeId: string, _userId: string, id: string) {
    const [vendor] = await db()
      .update(vendors)
      .set({ isDeleted: true, updatedAt: now() })
      .where(and(eq(vendors.id, id), eq(vendors.storeId, storeId)))
      .returning();

    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  static async getPurchaseOrders(storeId: string) {
    return db().query.purchaseOrders.findMany({
      where: and(eq(purchaseOrders.storeId, storeId), eq(purchaseOrders.isDeleted, false)),
      with: {
        vendor: true,
        items: {
          with: { item: true },
        },
      },
      orderBy: desc(purchaseOrders.createdAt),
    });
  }

  static async createPurchaseOrder(
    storeId: string,
    userId: string,
    data: {
      vendorId: string;
      poNumber: string;
      notes?: string;
      items: {
        itemId: string;
        quantity: number;
        unitPrice: number;
      }[];
    },
  ) {
    const { items: lineItems, ...poData } = data;
    const totalAmount = Number(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2),
    );
    const database = db();
    const poId = newId();
    const ts = now();

    const [po] = await database
      .insert(purchaseOrders)
      .values({
        id: poId,
        ...poData,
        storeId,
        totalAmount,
        createdBy: userId,
        status: 'DRAFT',
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    try {
      await database.insert(purchaseOrderItems).values(
        lineItems.map((item) => ({
          id: newId(),
          poId,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
        })),
      );
    } catch (itemErr) {
      await database.delete(purchaseOrders).where(eq(purchaseOrders.id, poId));
      throw new Error(
        `Failed to add items to Purchase Order: ${itemErr instanceof Error ? itemErr.message : 'Unknown error'}`,
      );
    }

    return (
      (await database.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, poId),
        with: { items: true },
      })) ?? po
    );
  }

  static async updateOrderStatus(storeId: string, _userId: string, id: string, status: string) {
    const oldPo = await db().query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.storeId, storeId)),
    });

    if (!oldPo) throw new Error('Purchase Order not found');

    const [newPo] = await db()
      .update(purchaseOrders)
      .set({ status, updatedAt: now() })
      .where(eq(purchaseOrders.id, id))
      .returning();

    return newPo;
  }

  static async getPurchaseInvoices(storeId: string) {
    return db().query.purchaseInvoices.findMany({
      where: and(eq(purchaseInvoices.storeId, storeId), eq(purchaseInvoices.isDeleted, false)),
      with: {
        vendor: true,
        items: {
          with: { item: true, warehouse: true },
        },
      },
      orderBy: desc(purchaseInvoices.createdAt),
    });
  }

  static async createPurchaseInvoice(
    storeId: string,
    userId: string,
    data: {
      vendorId: string;
      invoiceNumber: string;
      financialYear: string;
      notes?: string;
      poId?: string | null;
      items: {
        itemId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
      }[];
    },
  ) {
    const database = db();

    const existing = await database.query.purchaseInvoices.findFirst({
      where: and(
        eq(purchaseInvoices.storeId, storeId),
        eq(purchaseInvoices.vendorId, data.vendorId),
        eq(purchaseInvoices.invoiceNumber, data.invoiceNumber),
        eq(purchaseInvoices.financialYear, data.financialYear),
        eq(purchaseInvoices.isDeleted, false),
      ),
    });

    if (existing) {
      throw new Error(
        'Duplicate Supplier Invoice number is not allowed for the same supplier in the same financial year.',
      );
    }

    const { items: lineItems, poId, ...invData } = data;
    const totalAmount = Number(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2),
    );
    const invoiceId = newId();
    const ts = now();

    const [invoice] = await database
      .insert(purchaseInvoices)
      .values({
        id: invoiceId,
        ...invData,
        storeId,
        totalAmount,
        poId: poId || null,
        status: 'COMPLETED',
        createdBy: userId,
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    try {
      await database.insert(purchaseInvoiceItems).values(
        lineItems.map((item) => ({
          id: newId(),
          invoiceId,
          itemId: item.itemId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
        })),
      );
    } catch (itemErr) {
      await database.delete(purchaseInvoices).where(eq(purchaseInvoices.id, invoiceId));
      throw new Error(
        `Failed to add items to Payable Invoice: ${itemErr instanceof Error ? itemErr.message : 'Unknown error'}`,
      );
    }

    for (const item of lineItems) {
      const existingStock = await database.query.stocks.findFirst({
        where: and(eq(stocks.itemId, item.itemId), eq(stocks.warehouseId, item.warehouseId)),
      });

      if (existingStock) {
        await database
          .update(stocks)
          .set({
            quantity: Number(existingStock.quantity) + Number(item.quantity),
            updatedAt: now(),
          })
          .where(eq(stocks.id, existingStock.id));
      } else {
        await database.insert(stocks).values({
          id: newId(),
          storeId,
          itemId: item.itemId,
          warehouseId: item.warehouseId,
          quantity: Number(item.quantity),
          updatedAt: now(),
        });
      }

      await database.insert(inventoryTransactions).values({
        id: newId(),
        storeId,
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        type: 'IN',
        quantity: Number(item.quantity),
        reference: `Supplier Invoice ${data.invoiceNumber}`,
        performedBy: userId,
        createdAt: now(),
      });
    }

    if (poId) {
      await database
        .update(purchaseOrders)
        .set({ status: 'COMPLETED', updatedAt: now() })
        .where(eq(purchaseOrders.id, poId));
    }

    return invoice;
  }
}
