import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

export const GET = withAuth(async (_req, ctx) => {
  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        item: {
          select: { name: true, sku: true }
        },
        warehouse: {
          select: { name: true, code: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100
    });

    return apiSuccess(transactions);
  } catch (err) {
    console.error("[Transactions API Error]", err);
    return apiError("Internal server error", 500);
  }
});
