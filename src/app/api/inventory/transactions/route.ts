export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const { data: transactions } = await db()
      .from('InventoryTransaction')
      .select('*, item:Item(name, sku), warehouse:Warehouse(name, code)')
      .eq('tenantId', ctx.tenantId)
      .order('createdAt', { ascending: false })
      .limit(100);

    return apiSuccess(transactions || []);
  } catch (err) {
    console.error("[Transactions API Error]", err);
    return apiError("Internal server error", 500);
  }
});
