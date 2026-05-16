import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🌱 Starting seeding via API...");

    // 1. Create/Get Tenant
    let tenant = await prisma.tenant.findUnique({
      where: { slug: "zeron-demo" },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "Zeron Demo Corp",
          slug: "zeron-demo",
          settings: {},
        },
      });
      console.log(`✅ Created Tenant: ${tenant.name}`);
    }

    // 2. Create Warehouses
    const warehouses = [
      { name: "Main Warehouse", code: "WH-MAIN", location: "Mumbai, MH" },
      { name: "Retail Store - Delhi", code: "WH-DELHI", location: "New Delhi, DL" },
    ];

    for (const wh of warehouses) {
      await prisma.warehouse.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: wh.code } },
        update: {},
        create: { ...wh, tenantId: tenant.id },
      });
    }

    const whMain = await prisma.warehouse.findFirst({ 
      where: { code: "WH-MAIN", tenantId: tenant.id } 
    });

    if (!whMain) throw new Error("Main warehouse not found");

    // 3. Create Items
    const items = [
      { sku: "IPHONE-15-PRO", name: "iPhone 15 Pro", uom: "pcs", basePrice: 129900 },
      { sku: "MACBOOK-M3-AIR", name: "MacBook Air M3", uom: "pcs", basePrice: 114900 },
      { sku: "AIRPODS-PRO-2", name: "AirPods Pro (2nd Gen)", uom: "pcs", basePrice: 24900 },
    ];

    for (const item of items) {
      const createdItem = await prisma.item.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: item.sku } },
        update: { basePrice: item.basePrice },
        create: { ...item, tenantId: tenant.id },
      });

      // Add initial stock
      await prisma.stock.upsert({
        where: { itemId_warehouseId: { itemId: createdItem.id, warehouseId: whMain.id } },
        update: { quantity: { increment: 50 } },
        create: {
          tenantId: tenant.id,
          itemId: createdItem.id,
          warehouseId: whMain.id,
          quantity: 100,
        },
      });

      // Log transaction
      await prisma.inventoryTransaction.create({
        data: {
          tenantId: tenant.id,
          itemId: createdItem.id,
          warehouseId: whMain.id,
          type: "IN",
          quantity: 100,
          reference: "Initial Seed Data",
        },
      });
    }

    // 4. Create Customers
    const customers = [
      { name: "Tech Solutions Inc", contactName: "Rahul Sharma", email: "rahul@techsol.com" },
      { name: "Future Retail Ltd", contactName: "Priya Gupta", email: "priya@futureretail.in" },
    ];

    for (const cust of customers) {
      await prisma.customer.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: cust.name } },
        update: { email: cust.email, contactName: cust.contactName },
        create: { ...cust, tenantId: tenant.id },
      });
    }

    // 5. Create Vendors
    const vendors = [
      { name: "Apple Distribution India", contactName: "Vikram Singh", email: "orders@apple.in" },
      { name: "Global Logistics Ltd", contactName: "Sanjay Jha", email: "info@global-log.com" },
    ];

    for (const vendor of vendors) {
      await prisma.vendor.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: vendor.name } },
        update: { email: vendor.email, contactName: vendor.contactName },
        create: { ...vendor, tenantId: tenant.id },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Seeding completed successfully",
      tenant: { id: tenant.id, name: tenant.name }
    });
  } catch (error: any) {
    console.error("❌ Seeding Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Seeding failed" 
    }, { status: 500 });
  }
}
