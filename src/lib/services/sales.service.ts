/**
 * Sales Service (Cloudflare D1 / Drizzle)
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  customers,
  inventoryTransactions,
  salesInvoiceItems,
  salesInvoices,
  stocks,
} from '@/db/schema';
import { newId, now, toJson, withTimestamps } from '@/db/helpers';
import { normalizePartnerTaxFields } from '@/lib/partner-schema';

export class SalesService {
  static async getCustomers(storeId: string) {
    return db().query.customers.findMany({
      where: and(eq(customers.storeId, storeId), eq(customers.isDeleted, false)),
      orderBy: customers.name,
    });
  }

  static async createCustomer(
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

    const [customer] = await db()
      .insert(customers)
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

    return customer;
  }

  static async deleteCustomer(storeId: string, _userId: string, id: string) {
    const [customer] = await db()
      .update(customers)
      .set({ isDeleted: true, updatedAt: now() })
      .where(and(eq(customers.id, id), eq(customers.storeId, storeId)))
      .returning();

    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  static async getSalesInvoices(storeId: string) {
    return db().query.salesInvoices.findMany({
      where: and(eq(salesInvoices.storeId, storeId), eq(salesInvoices.isDeleted, false)),
      with: {
        customer: true,
        items: {
          with: { item: true, warehouse: true },
        },
      },
      orderBy: desc(salesInvoices.createdAt),
    });
  }

  static async getOrCreateWalkInCustomer(storeId: string, userId: string) {
    const database = db();

    const customer = await database.query.customers.findFirst({
      where: and(
        eq(customers.storeId, storeId),
        eq(customers.name, 'Walk-in Customer'),
        eq(customers.isDeleted, false),
      ),
    });

    if (customer) return customer;

    const [newCustomer] = await database
      .insert(customers)
      .values(
        withTimestamps({
          id: newId(),
          storeId,
          name: 'Walk-in Customer',
          contactName: 'Retail Buyer',
          createdBy: userId,
        }),
      )
      .returning();

    return newCustomer;
  }

  static async createSalesInvoice(
    storeId: string,
    userId: string,
    data: {
      customerId?: string;
      invoiceNumber: string;
      financialYear: string;
      notes?: string;
      paymentMethod?: string;
      amountReceived?: number;
      amountReturned?: number;
      items: {
        itemId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
      }[];
    },
  ) {
    const database = db();

    let customerId = data.customerId;
    if (!customerId || customerId === 'walkin') {
      const walkIn = await this.getOrCreateWalkInCustomer(storeId, userId);
      customerId = walkIn.id;
    }

    const existing = await database.query.salesInvoices.findFirst({
      where: and(
        eq(salesInvoices.storeId, storeId),
        eq(salesInvoices.invoiceNumber, data.invoiceNumber),
        eq(salesInvoices.financialYear, data.financialYear),
        eq(salesInvoices.isDeleted, false),
      ),
    });

    if (existing) {
      throw new Error('Duplicate Sales Invoice number is not allowed in the same financial year.');
    }

    const { items: lineItems, customerId: _ignored, ...invData } = data;
    const totalAmount = Number(
      lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2),
    );
    const invoiceId = newId();
    const ts = now();

    const [invoice] = await database
      .insert(salesInvoices)
      .values({
        id: invoiceId,
        ...invData,
        customerId,
        storeId,
        totalAmount,
        status: 'COMPLETED',
        paymentMethod: data.paymentMethod || 'CASH',
        amountReceived: data.amountReceived !== undefined ? data.amountReceived : totalAmount,
        amountReturned: data.amountReturned !== undefined ? data.amountReturned : 0,
        createdBy: userId,
        createdAt: ts,
        updatedAt: ts,
      })
      .returning();

    try {
      await database.insert(salesInvoiceItems).values(
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
      await database.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
      throw new Error(
        `Failed to add items to Sales Invoice: ${itemErr instanceof Error ? itemErr.message : 'Unknown error'}`,
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
            quantity: Number(existingStock.quantity) - Number(item.quantity),
            updatedAt: now(),
          })
          .where(eq(stocks.id, existingStock.id));
      } else {
        await database.insert(stocks).values({
          id: newId(),
          storeId,
          itemId: item.itemId,
          warehouseId: item.warehouseId,
          quantity: -Number(item.quantity),
          updatedAt: now(),
        });
      }

      await database.insert(inventoryTransactions).values({
        id: newId(),
        storeId,
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        type: 'OUT',
        quantity: -Number(item.quantity),
        reference: `Sales Invoice ${data.invoiceNumber}`,
        performedBy: userId,
        createdAt: now(),
      });
    }

    return invoice;
  }
}
