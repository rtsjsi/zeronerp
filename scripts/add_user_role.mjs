import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const connectionString = "postgresql://postgres.ttmqdpdlgwccuhdsooba:2nfO66M0WeP6Jw4A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function runSQL() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to database...");

    const sql = fs.readFileSync('d:/myProjects/zeronerp/database-schema/add_user_role.sql', 'utf8');
    await client.query(sql);
    console.log("✅ User roles added successfully!");

  } catch (err) {
    console.error("❌ SQL execution failed:", err);
  } finally {
    await client.end();
  }
}

runSQL();
