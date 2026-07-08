export const dynamic = "force-dynamic";
import { desc, eq } from 'drizzle-orm';
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { inventoryTransactions } from '@/db/schema';
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const transactions = await db().query.inventoryTransactions.findMany({
      where: eq(inventoryTransactions.storeId, ctx.storeId),
      with: {
        item: { columns: { name: true } },
        warehouse: { columns: { name: true, code: true } },
      },
      orderBy: desc(inventoryTransactions.createdAt),
      limit: 100,
    });

    return apiSuccess(transactions);
  } catch (err) {
    console.error("[Transactions API Error]", err);
    return apiError("Internal server error", 500);
  }
});
