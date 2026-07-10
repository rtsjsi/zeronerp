/**
 * Procurement Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  inventoryTransactions,
  purchaseInvoiceItems,
  purchaseInvoices,
  stocks,
  vendors,
} from '@/db/schema';
import { newId, now, toJson, withTimestamps } from '@/db/helpers';
import { normalizePartnerTaxFields, normalizePartnerInput } from '@/lib/partner-schema';

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
      pan?: string;
      gstn?: string;
      customFields?: Record<string, unknown>;
    },
  ) {
    const taxFields = normalizePartnerTaxFields(data);

    const [vendor] = await db()
      .insert(vendors)
      .values(
        withTimestamps({
          id: newId(),
          name: data.name.trim(),
          contactName: data.contactName?.trim() || null,
          email: data.email?.trim() || null,
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          ...taxFields,
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

  static async updateVendor(
    storeId: string,
    _userId: string,
    id: string,
    data: {
      name: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      pan?: string;
      gstn?: string;
    },
  ) {
    const normalized = normalizePartnerInput(data);

    const [vendor] = await db()
      .update(vendors)
      .set({ ...normalized, updatedAt: now() })
      .where(
        and(eq(vendors.id, id), eq(vendors.storeId, storeId), eq(vendors.isDeleted, false)),
      )
      .returning();

    if (!vendor) throw new Error('Vendor not found');
    return vendor;
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
      invoiceDate: string;
      financialYear: string;
      items: {
        itemId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
        gstRate: number;
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

    const { items: lineItems, ...invData } = data;
    const lineTotal = (item: { quantity: number; unitPrice: number; gstRate: number }) => {
      const taxable = item.quantity * item.unitPrice;
      return Number((taxable * (1 + item.gstRate / 100)).toFixed(2));
    };
    const totalAmount = Number(
      lineItems.reduce((sum, item) => sum + lineTotal(item), 0).toFixed(2),
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
          gstRate: item.gstRate,
          totalPrice: lineTotal(item),
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

    return invoice;
  }
}
