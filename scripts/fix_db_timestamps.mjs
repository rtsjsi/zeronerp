import pg from 'pg';

import * as dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function fixTimeDefaults() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database...");

    const tables = [
      'Tenant', 'User', 'AuditLog', 'CustomFieldDefinition', 
      'Item', 'Warehouse', 'Stock', 'InventoryTransaction',
      'Vendor', 'PurchaseOrder', 'PurchaseOrderItem',
      'Customer', 'SalesOrder', 'SalesOrderItem',
      'ProductionBatch', 'ProductionMaterial'
    ];

    for (const table of tables) {
      console.log(`Fixing timestamps for ${table}...`);
      
      // Fix createdAt if it exists
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "createdAt" SET DEFAULT now()`);
      } catch (e) {}

      // Fix updatedAt if it exists
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
      } catch (e) {}
    }

    console.log("✅ All tables updated with timestamp defaults!");

  } catch (err) {
    console.error("❌ Fix failed:", err);
  } finally {
    await client.end();
  }
}

fixTimeDefaults();
