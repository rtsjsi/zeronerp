export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth-middleware";
import { FG_BULK_OIL_ITEMS } from "@/lib/inventory/fg-bulk-oil-items";
import { FG_OIL_ITEMS } from "@/lib/inventory/fg-oil-items";
import { InventoryService } from "@/lib/services/inventory.service";
import { db } from "@/lib/db";
import { items } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api-response";

export const POST = withAuth(async (_req, ctx) => {
  try {
    if (ctx.user.role === "USER") {
      return apiError("Permission denied: admin access required", 403);
    }

    const database = db();

    const existing = await database.query.items.findMany({
      where: eq(items.storeId, ctx.storeId),
    });
    const existingNames = new Set(existing.map((i) => i.name));

    let created = 0;
    let skipped = 0;

    for (const item of FG_OIL_ITEMS) {
      if (existingNames.has(item.name)) {
        skipped++;
        continue;
      }

      await InventoryService.createItem(ctx.storeId, ctx.userId, {
        name: item.name,
        category: "FINISHED_GOODS",
        itemType: "STOCKABLE",
        uom: "NOS",
        mrp: item.mrp,
      });

      existingNames.add(item.name);
      created++;
    }

    for (const item of FG_BULK_OIL_ITEMS) {
      if (existingNames.has(item.name)) {
        skipped++;
        continue;
      }

      await InventoryService.createItem(ctx.storeId, ctx.userId, {
        name: item.name,
        category: "FINISHED_GOODS",
        itemType: "STOCKABLE",
        uom: "LTR",
      });

      existingNames.add(item.name);
      created++;
    }

    return apiSuccess(
      { created, skipped },
      "FG oil items seeded (idempotent)",
    );
  } catch (err) {
    console.error("[Seed FG Items Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
