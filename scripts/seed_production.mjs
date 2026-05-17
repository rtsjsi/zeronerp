import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables for Supabase connection');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedProduction() {
  console.log("🌱 Seeding sample production batches...");

  const { data: tenants } = await supabase.from('Tenant').select('*').limit(1);
  const tenantId = tenants[0].id;
  const now = new Date().toISOString();

  // Get some items and warehouses
  const { data: items } = await supabase.from('Item').select('*').eq('tenantId', tenantId);
  const { data: warehouses } = await supabase.from('Warehouse').select('*').eq('tenantId', tenantId);

  const rawSeeds = items.find(i => i.sku.includes('SEED'));
  const oil1L = items.find(i => i.sku === 'FG-MO-1L');
  const bottles = items.find(i => i.sku === 'PM-BOT-1L');
  const plant = warehouses.find(w => w.code === 'WH-PLANT-01');

  if (!rawSeeds || !oil1L || !plant) {
    console.error("❌ Missing required items/warehouses for production seed. Run the main seed script first!");
    return;
  }

  // 1. Create a Completed Batch
  const batch1Id = crypto.randomUUID();
  await supabase.from('ProductionBatch').insert({
    id: batch1Id,
    tenantId,
    batchNumber: 'BT-2024-001',
    status: 'COMPLETED',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 80000000).toISOString(),
    notes: 'Standard morning run.',
    createdAt: now,
    updatedAt: now
  });

  await supabase.from('ProductionMaterial').insert([
    { tenantId, batchId: batch1Id, itemId: rawSeeds.id, warehouseId: plant.id, type: 'INPUT', quantity: 2.5 },
    { tenantId, batchId: batch1Id, itemId: oil1L.id, warehouseId: plant.id, type: 'OUTPUT', quantity: 2000 }
  ]);

  // 2. Create an In-Progress Batch
  const batch2Id = crypto.randomUUID();
  await supabase.from('ProductionBatch').insert({
    id: batch2Id,
    tenantId,
    batchNumber: 'BT-2024-002',
    status: 'IN_PROGRESS',
    startTime: now,
    notes: 'Large batch for national distribution.',
    createdAt: now,
    updatedAt: now
  });

  await supabase.from('ProductionMaterial').insert([
    { tenantId, batchId: batch2Id, itemId: rawSeeds.id, warehouseId: plant.id, type: 'INPUT', quantity: 5.0 },
    { tenantId, batchId: batch2Id, itemId: bottles.id, warehouseId: plant.id, type: 'INPUT', quantity: 4000 }
  ]);

  console.log("🎉 Production seeding completed!");
}

seedProduction();
