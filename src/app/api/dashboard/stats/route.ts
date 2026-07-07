export const dynamic = "force-dynamic";

import { and, count, eq, gte, ne } from 'drizzle-orm';
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import {
  customers,
  items,
  purchaseOrders,
  salesOrders,
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
      totalInventoryValue += Number(item.basePrice) * totalQty;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSalesData = await database
      .select({ totalAmount: salesOrders.totalAmount })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.storeId, storeId),
          eq(salesOrders.isDeleted, false),
          ne(salesOrders.status, 'CANCELLED'),
          gte(salesOrders.createdAt, startOfMonth.toISOString()),
        ),
      );

    const monthSales = monthSalesData.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const [{ value: pendingPOs = 0 }] = await database
      .select({ value: count() })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.storeId, storeId),
          eq(purchaseOrders.isDeleted, false),
          eq(purchaseOrders.status, 'DRAFT'),
        ),
      );

    const [{ value: pendingSOs = 0 }] = await database
      .select({ value: count() })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.storeId, storeId),
          eq(salesOrders.isDeleted, false),
          eq(salesOrders.status, 'DRAFT'),
        ),
      );

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
      pendingOrders: pendingPOs + pendingSOs,
      vendorCount,
      customerCount,
    });
  } catch (err) {
    console.error("[Dashboard Stats API Error]", err);
    return apiError("Internal server error", 500);
  }
});
