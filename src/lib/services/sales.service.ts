import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";

export class SalesService {
  /**
   * CUSTOMER CRUD
   */

  static async getCustomers(tenantId: string) {
    return prisma.customer.findMany({
      where: { tenantId, isDeleted: false },
      orderBy: { name: "asc" },
    });
  }

  static async createCustomer(tenantId: string, userId: string, data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    customFields?: Record<string, unknown>;
  }) {
    const customer = await prisma.customer.create({
      data: {
        ...data,
        tenantId,
        createdBy: userId,
      },
    });

    await AuditService.log(tenantId, userId, "Customer", customer.id, "create", null, customer);
    return customer;
  }

  /**
   * SALES ORDER CRUD
   */

  static async getSalesOrders(tenantId: string) {
    return prisma.salesOrder.findMany({
      where: { tenantId, isDeleted: false },
      include: {
        customer: true,
        items: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createSalesOrder(tenantId: string, userId: string, data: {
    customerId: string;
    soNumber: string;
    notes?: string;
    items: {
      itemId: string;
      quantity: number;
      unitPrice: number;
    }[];
  }) {
    const { items, ...soData } = data;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const so = await prisma.salesOrder.create({
      data: {
        ...soData,
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

    await AuditService.log(tenantId, userId, "SalesOrder", so.id, "create", null, so);
    return so;
  }

  static async updateOrderStatus(tenantId: string, userId: string, id: string, status: string) {
    const oldSo = await prisma.salesOrder.findFirst({ 
      where: { id, tenantId },
      include: { items: true }
    });
    if (!oldSo) throw new Error("Sales Order not found");

    const newSo = await prisma.salesOrder.update({
      where: { id },
      data: { status },
    });

    // If order is CONFIRMED, deduct stock from the first available warehouse
    // In a real app, you'd pick a specific warehouse or handle multiple shipments
    if (status === "CONFIRMED" && oldSo.status === "DRAFT") {
      const warehouse = await prisma.warehouse.findFirst({ where: { tenantId } });
      
      if (warehouse) {
        for (const orderItem of oldSo.items) {
          await prisma.stock.upsert({
            where: {
              itemId_warehouseId: {
                itemId: orderItem.itemId,
                warehouseId: warehouse.id,
              },
            },
            create: {
              tenantId,
              itemId: orderItem.itemId,
              warehouseId: warehouse.id,
              quantity: -orderItem.quantity,
            },
            update: {
              quantity: { decrement: orderItem.quantity },
            },
          });

          // Log the stock transaction
          await prisma.inventoryTransaction.create({
            data: {
              tenantId,
              itemId: orderItem.itemId,
              warehouseId: warehouse.id,
              type: "OUT",
              quantity: -orderItem.quantity,
              reference: `Sales Order ${oldSo.soNumber}`,
              performedBy: userId,
            },
          });
        }
      }
    }

    await AuditService.log(tenantId, userId, "SalesOrder", id, "update_status", oldSo, newSo);
    return newSo;
  }
}
