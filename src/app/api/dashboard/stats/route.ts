export const dynamic = "force-dynamic";

import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const tenantId = ctx.tenantId;
    const supaDb = db();

    // 1. Total Inventory Value
    const { data: items } = await supaDb
      .from('Item')
      .select('basePrice, stocks:Stock(quantity)')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false);

    let totalInventoryValue = 0;
    (items || []).forEach((item: any) => {
      const totalQty = (item.stocks || []).reduce((sum: number, s: any) => sum + Number(s.quantity), 0);
      totalInventoryValue += Number(item.basePrice) * totalQty;
    });

    // 2. This Month Sales
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthSalesData } = await supaDb
      .from('SalesOrder')
      .select('totalAmount')
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .neq('status', 'CANCELLED')
      .gte('createdAt', startOfMonth.toISOString());

    const monthSales = (monthSalesData || []).reduce(
      (sum: number, o: any) => sum + Number(o.totalAmount || 0), 0
    );

    // 3. Pending Orders
    const { count: pendingPOs } = await supaDb
      .from('PurchaseOrder')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .eq('status', 'DRAFT');

    const { count: pendingSOs } = await supaDb
      .from('SalesOrder')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .eq('isDeleted', false)
      .eq('status', 'DRAFT');

    // 4. Counts
    const { count: vendorCount } = await supaDb
      .from('Vendor')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .eq('isDeleted', false);

    const { count: customerCount } = await supaDb
      .from('Customer')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .eq('isDeleted', false);

    return apiSuccess({
      inventoryValue: totalInventoryValue,
      monthSales,
      pendingOrders: (pendingPOs || 0) + (pendingSOs || 0),
      vendorCount: vendorCount || 0,
      customerCount: customerCount || 0,
    });
  } catch (err) {
    console.error("[Dashboard Stats API Error]", err);
    return apiError("Internal server error", 500);
  }
});
