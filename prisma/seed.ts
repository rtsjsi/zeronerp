import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Get or Create a Tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Zeron Demo Corp",
        slug: "zeron-demo",
        settings: {},
      },
    });
    console.log(`✅ Created Tenant: ${tenant.name}`);
  } else {
    console.log(`ℹ️ Using existing Tenant: ${tenant.name}`);
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
  console.log("✅ Warehouses synced");

  const whMain = await prisma.warehouse.findFirst({ where: { code: "WH-MAIN", tenantId: tenant.id } });

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

    // Add initial stock if not exists
    if (whMain) {
      await prisma.stock.upsert({
        where: { itemId_warehouseId: { itemId: createdItem.id, warehouseId: whMain.id } },
        update: {},
        create: {
          tenantId: tenant.id,
          itemId: createdItem.id,
          warehouseId: whMain.id,
          quantity: 50,
        },
      });
    }
  }
  console.log("✅ Items and initial stock synced");

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
  console.log("✅ Customers synced");

  console.log("🏁 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
