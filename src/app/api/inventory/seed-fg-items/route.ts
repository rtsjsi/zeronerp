export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth-middleware";
import { InventoryService } from "@/lib/services/inventory.service";
import { db } from "@/lib/db";
import { items } from "@/db/schema";
import { apiError, apiSuccess } from "@/lib/api-response";

const FG_PACKS: Array<{
  productKey: string;
  productName: string;
  packSizes: string[];
}> = [
  {
    productKey: "GROUNDNUT_OIL",
    productName: "Groundnut Oil",
    packSizes: ["500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "MUSTARD_OIL",
    productName: "Mustard Oil",
    packSizes: ["200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "CASTOR_OIL",
    productName: "Castor Oil",
    packSizes: ["200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "SESAME_OIL",
    productName: "Sesame Oil",
    packSizes: ["200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "BLACK_SESAME_OIL",
    productName: "Black Sesame Oil",
    packSizes: ["200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "SUNFLOWER_OIL",
    productName: "Sunflower Oil",
    packSizes: ["200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "COCONUT_OIL",
    productName: "Coconut Oil",
    packSizes: ["100ml", "200ml", "500ml", "1L", "5L", "15L"],
  },
  {
    productKey: "ALMOND_OIL",
    productName: "Almond Oil",
    packSizes: ["50ml", "100ml", "200ml", "500ml"],
  },
];

function toSkuSize(packSize: string) {
  // "500ml" => "500ML", "1L" => "1L"
  return packSize.toUpperCase().replace(/\s+/g, "");
}

export const POST = withAuth(async (_req, ctx) => {
  try {
    if (ctx.user.role === "USER") {
      return apiError("Permission denied: admin access required", 403);
    }

    const database = db();

    const existing = await database.query.items.findMany({
      where: eq(items.storeId, ctx.storeId),
    });
    const existingSkus = new Set(existing.map((i) => i.sku));

    let created = 0;
    let skipped = 0;

    for (const group of FG_PACKS) {
      for (const packSize of group.packSizes) {
        const sku = `${group.productKey}_${toSkuSize(packSize)}`;
        if (existingSkus.has(sku)) {
          skipped++;
          continue;
        }

        await InventoryService.createItem(ctx.storeId, ctx.userId, {
          sku,
          name: `${group.productName} - ${packSize}`,
          description: `${group.productName} (${packSize})`,
          category: "FINISHED_GOODS",
          itemType: "STOCKABLE",
          uom: "pcs",
          basePrice: 0,
        });

        existingSkus.add(sku);
        created++;
      }
    }

    return apiSuccess(
      { created, skipped },
      "FG pack-size items seeded (idempotent)",
    );
  } catch (err) {
    console.error("[Seed FG Items Error]", err);
    return apiError(err instanceof Error ? err.message : "Internal server error", 500);
  }
});

