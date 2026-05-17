import pg from 'pg';
import fs from 'fs';

import * as dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function runSQL() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database...");

    const sql = fs.readFileSync('d:/myProjects/zeronerp/database-schema/pos_alter.sql', 'utf8');
    await client.query(sql);
    console.log("✅ SalesInvoice table successfully updated for B2C Retail/POS!");

  } catch (err) {
    console.error("❌ SQL execution failed:", err);
  } finally {
    await client.end();
  }
}

runSQL();
