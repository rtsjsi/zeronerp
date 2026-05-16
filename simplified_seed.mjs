import pg from 'pg';
const { Client } = pg;

// Use the pooler URL from the environment
const connectionString = 'postgresql://postgres.ttmqdpdlgwccuhdsooba:2nfO66M0WeP6Jw4A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true';

async function seed() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to DB.");

    const tenantId = 'ff2cb2c8-f4d2-4e82-a622-f047f8708654';

    // 1. Create Demo Tenant
    await client.query(`
      INSERT INTO "Tenant" (id, name, slug, settings, "aiEnabled", "isActive", "isDeleted", "createdAt", "updatedAt")
      VALUES ($1, 'Zeron Demo Corp', 'zeron-demo', '{}', true, true, false, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, [tenantId]);
    console.log("Tenant created.");

    // 2. Create Warehouses
    const whDelhi = '550e8400-e29b-41d4-a716-446655440000';
    await client.query(`
      INSERT INTO "Warehouse" (id, "tenantId", name, code, location, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, 'Main Warehouse', 'WH-MAIN', 'Mumbai, MH', true, NOW(), NOW())
      ON CONFLICT ("tenantId", code) DO NOTHING
    `, [whDelhi, tenantId]);
    console.log("Warehouses created.");

    // 3. Create Items
    const item1 = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
    await client.query(`
      INSERT INTO "Item" (id, "tenantId", sku, name, description, uom, "basePrice", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, 'APP-IPH-15P', 'iPhone 15 Pro', '256GB, Titanium Blue', 'pcs', 129900.00, true, NOW(), NOW())
      ON CONFLICT ("tenantId", sku) DO NOTHING
    `, [item1, tenantId]);
    console.log("Items created.");

    // 4. Create Initial Stock
    await client.query(`
      INSERT INTO "Stock" (id, "tenantId", "itemId", "warehouseId", quantity, "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, 50, NOW())
      ON CONFLICT ("itemId", "warehouseId") DO NOTHING
    `, [tenantId, item1, whDelhi]);
    console.log("Stock initialized.");

    // 5. Create Customers
    await client.query(`
      INSERT INTO "Customer" (id, "tenantId", name, email, phone, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'Reliance Digital', 'procurement@reliance.com', '1800-889-1010', true, NOW(), NOW())
      ON CONFLICT ("tenantId", name) DO NOTHING
    `, [tenantId]);
    console.log("Customers created.");

    // 6. Create Vendors
    await client.query(`
      INSERT INTO "Vendor" (id, "tenantId", name, email, phone, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'Apple India Pvt Ltd', 'sales@apple.com', '000-800-040-1961', true, NOW(), NOW())
      ON CONFLICT ("tenantId", name) DO NOTHING
    `, [tenantId]);
    console.log("Vendors created.");

    console.log("Seeding complete!");

  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await client.end();
  }
}

seed();
