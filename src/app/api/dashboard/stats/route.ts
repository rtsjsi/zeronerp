export const dynamic = "force-dynamic";

import { and, count, eq, gte } from 'drizzle-orm';
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import {
  customers,
  items,
  salesInvoices,
  vendors,
} from '@/db/schema';
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const storeId = ctx.storeId;
    const database = db();

    const storeItems = await database.query.items.findMany({
      where: and(eq(items.storeId, storeId), eq(items.isDeleted, false)),
      with: { stocks: true },
    });

    let totalInventoryValue = 0;
    for (const item of storeItems) {
      const totalQty = (item.stocks || []).reduce((sum, s) => sum + Number(s.quantity), 0);
      totalInventoryValue += Number(item.cost) * totalQty;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSalesData = await database
      .select({ totalAmount: salesInvoices.totalAmount })
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.storeId, storeId),
          eq(salesInvoices.isDeleted, false),
          gte(salesInvoices.createdAt, startOfMonth.toISOString()),
        ),
      );

    const monthSales = monthSalesData.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const [{ value: vendorCount = 0 }] = await database
      .select({ value: count() })
      .from(vendors)
      .where(and(eq(vendors.storeId, storeId), eq(vendors.isDeleted, false)));

    const [{ value: customerCount = 0 }] = await database
      .select({ value: count() })
      .from(customers)
      .where(and(eq(customers.storeId, storeId), eq(customers.isDeleted, false)));

    return apiSuccess({
      inventoryValue: totalInventoryValue,
      monthSales,
      pendingOrders: 0,
      vendorCount,
      customerCount,
    });
  } catch (err) {
    console.error("[Dashboard Stats API Error]", err);
    return apiError("Internal server error", 500);
  }
});
