import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const tenantId = ctx.tenantId;

    // 1. Total Inventory Value (Base price * quantity in stock)
    const items = await prisma.item.findMany({
      where: { tenantId, isDeleted: false },
      include: { stocks: true },
    });

    let totalInventoryValue = 0;
    items.forEach(item => {
      const totalQty = item.stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
      totalInventoryValue += Number(item.basePrice) * totalQty;
    });

    // 2. This Month Sales
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSales = await prisma.salesOrder.aggregate({
      where: { 
        tenantId, 
        isDeleted: false,
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" }
      },
      _sum: { totalAmount: true }
    });

    // 3. Pending Orders (PO + SO)
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { tenantId, isDeleted: false, status: "DRAFT" }
    });
    const pendingSOs = await prisma.salesOrder.count({
      where: { tenantId, isDeleted: false, status: "DRAFT" }
    });

    // 4. Counts for display
    const vendorCount = await prisma.vendor.count({ where: { tenantId, isDeleted: false } });
    const customerCount = await prisma.customer.count({ where: { tenantId, isDeleted: false } });

    return apiSuccess({
      inventoryValue: totalInventoryValue,
      monthSales: Number(monthSales._sum.totalAmount || 0),
      pendingOrders: pendingPOs + pendingSOs,
      vendorCount,
      customerCount
    });
  } catch (err) {
    console.error("[Dashboard Stats API Error]", err);
    return apiError("Internal server error", 500);
  }
});
