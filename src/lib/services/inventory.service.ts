import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";
// Using any for Decimal to avoid complex prisma runtime path issues during build
type Decimal = any;

export class InventoryService {
  /**
   * ITEM CRUD
   */

  static async getItems(tenantId: string) {
    return prisma.item.findMany({
      where: { tenantId },
      include: {
        stocks: {
          include: { warehouse: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async getItemById(tenantId: string, id: string) {
    return prisma.item.findFirst({
      where: { id, tenantId },
      include: {
        stocks: {
          include: { warehouse: true },
        },
      },
    });
  }

  static async createItem(tenantId: string, userId: string, data: {
    sku: string;
    name: string;
    description?: string;
    uom?: string;
    basePrice?: number | string | Decimal;
    customFields?: any;
  }) {
    const item = await prisma.item.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });

    await AuditService.log(tenantId, userId, "Item", item.id, "create", null, item);
    return item;
  }

  static async updateItem(tenantId: string, userId: string, id: string, data: any) {
    const oldItem = await this.getItemById(tenantId, id);
    if (!oldItem) throw new Error("Item not found");

    const newItem = await prisma.item.update({
      where: { id },
      data,
    });

    await AuditService.log(tenantId, userId, "Item", id, "update", oldItem, newItem);
    return newItem;
  }

  static async deleteItem(tenantId: string, userId: string, id: string) {
    const item = await prisma.item.update({
      where: { id, tenantId },
      data: { isDeleted: true },
    });

    await AuditService.log(tenantId, userId, "Item", id, "delete", item, null);
    return item;
  }

  /**
   * WAREHOUSE CRUD
   */

  static async getWarehouses(tenantId: string) {
    return prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  static async createWarehouse(tenantId: string, userId: string, data: {
    name: string;
    code: string;
    location?: string;
  }) {
    const warehouse = await prisma.warehouse.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });

    await AuditService.log(tenantId, userId, "Warehouse", warehouse.id, "create", null, warehouse);
    return warehouse;
  }
}
