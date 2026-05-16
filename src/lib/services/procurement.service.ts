import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";

export class ProcurementService {
  /**
   * VENDOR CRUD
   */

  static async getVendors(tenantId: string) {
    return prisma.vendor.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
    });
  }

  static async createVendor(tenantId: string, userId: string, data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    customFields?: Record<string, unknown>;
  }) {
    const vendor = await prisma.vendor.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });

    await AuditService.log(tenantId, userId, "Vendor", vendor.id, "create", null, vendor);
    return vendor;
  }

  /**
   * PURCHASE ORDER CRUD
   */

  static async getPurchaseOrders(tenantId: string) {
    return prisma.purchaseOrder.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        vendor: true,
        items: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createPurchaseOrder(tenantId: string, userId: string, data: {
    vendorId: string;
    poNumber: string;
    notes?: string;
    items: {
      itemId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const { items, ...poData } = data;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        ...poData,
        tenantId,
        totalAmount,
        createdBy: userId,
        items: {
          create: items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await AuditService.log(tenantId, userId, "PurchaseOrder", po.id, "create", null, po);
    return po;
  }

  static async updateOrderStatus(tenantId: string, userId: string, id: string, status: string) {
    const oldPo = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!oldPo) throw new Error("Purchase Order not found");

    const newPo = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });

    await AuditService.log(tenantId, userId, "PurchaseOrder", id, "update_status", oldPo, newPo);
    return newPo;
  }
}
