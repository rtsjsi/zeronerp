import pg from 'pg';

import * as dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function fixDefaults() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database...");

    const tables = [
      'Tenant', 'User', 'AuditLog', 'CustomFieldDefinition', 
      'Item', 'Warehouse', 'Stock', 'InventoryTransaction',
      'Vendor', 'PurchaseOrder', 'PurchaseOrderItem',
      'Customer', 'SalesOrder', 'SalesOrderItem'
    ];

    for (const table of tables) {
      console.log(`Fixing ${table}...`);
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
    }

    console.log("✅ All tables updated with gen_random_uuid() defaults!");

  } catch (err) {
    console.error("❌ Fix failed:", err);
  } finally {
    await client.end();
  }
}

fixDefaults();
