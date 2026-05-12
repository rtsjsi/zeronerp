import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";

export class StockService {
  /**
   * Adjust stock level (Manual IN/OUT)
   */
  static async adjustStock(
    tenantId: string,
    userId: string,
    data: {
      itemId: string;
      warehouseId: string;
      quantity: number; // Positive for IN, Negative for OUT
      type: "IN" | "OUT";
      reference?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Update or Create Stock record
      const stock = await tx.stock.upsert({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.warehouseId,
          },
        },
        create: {
          tenantId,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
        },
        update: {
          quantity: { increment: data.quantity },
        },
      });

      // 2. Log Transaction
      const transaction = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          itemId: data.itemId,
          warehouseId: data.warehouseId,
          type: data.type,
          quantity: data.quantity,
          reference: data.reference || "Manual Adjustment",
          performedBy: userId,
        },
      });

      await AuditService.log(tenantId, userId, "Stock", stock.id, "update", null, {
        adjustment: data.quantity,
        newQuantity: stock.quantity,
      });

      return { stock, transaction };
    });
  }

  /**
   * Transfer stock between warehouses
   */
  static async transferStock(
    tenantId: string,
    userId: string,
    data: {
      itemId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
    }
  ) {
    if (data.quantity <= 0) throw new Error("Quantity must be positive");

    return prisma.$transaction(async (tx) => {
      // 1. Decrease from source
      await tx.stock.update({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.fromWarehouseId,
          },
        },
        data: { quantity: { decrement: data.quantity } },
      });

      // 2. Increase at destination
      await tx.stock.upsert({
        where: {
          itemId_warehouseId: {
            itemId: data.itemId,
            warehouseId: data.toWarehouseId,
          },
        },
        create: {
          tenantId,
          itemId: data.itemId,
          warehouseId: data.toWarehouseId,
          quantity: data.quantity,
        },
        update: { quantity: { increment: data.quantity } },
      });

      // 3. Log Transactions (OUT from source, IN to destination)
      await tx.inventoryTransaction.createMany({
        data: [
          {
            tenantId,
            itemId: data.itemId,
            warehouseId: data.fromWarehouseId,
            type: "OUT",
            quantity: -data.quantity,
            reference: `Transfer to ${data.toWarehouseId}`,
            performedBy: userId,
          },
          {
            tenantId,
            itemId: data.itemId,
            warehouseId: data.toWarehouseId,
            type: "IN",
            quantity: data.quantity,
            reference: `Transfer from ${data.fromWarehouseId}`,
            performedBy: userId,
          },
        ],
      });

      return { success: true };
    });
  }
}
