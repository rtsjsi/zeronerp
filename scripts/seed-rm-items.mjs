/**
 * Seed raw material items into D1 for all active stores.
 *
 * Usage:
 *   npm run db:seed-rm-items
 *   npm run db:seed-rm-items -- --remote
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const __dirname = dirname(fileURLToPath(import.meta.url));
const RM_SEED_ITEMS = JSON.parse(
  readFileSync(join(__dirname, '../src/lib/inventory/rm-seed-items.json'), 'utf8'),
);

function parseArgs(argv) {
  return { remote: argv.includes('--remote') };
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const args = parseArgs(process.argv.slice(2));
const remoteFlag = args.remote ? '--remote' : '';
const now = new Date().toISOString();

const insertStatements = RM_SEED_ITEMS.map((item) => {
  const id = randomUUID();
  const name = sqlEscape(item.name);
  return `INSERT INTO Item (id, storeId, name, category, itemType, uom, hsnSacCode, gstRate, reorderLevel, minStock, cost, mrp, isActive, isDeleted, createdBy, createdAt, updatedAt)
SELECT '${id}', s.id, '${name}', 'RAW_MATERIAL', 'STOCKABLE', 'kg', NULL, 0, 0, 0, 0, 0, 1, 0, NULL, '${now}', '${now}'
FROM Stores s
WHERE s.isDeleted = 0 AND s.isActive = 1
AND NOT EXISTS (
  SELECT 1 FROM Item i WHERE i.storeId = s.id AND i.name = '${name}' AND i.isDeleted = 0
);`;
});

const sql = insertStatements.join('\n');

const file = join(tmpdir(), `zeronerp-seed-rm-${Date.now()}.sql`);
writeFileSync(file, sql, 'utf8');

try {
  console.log(`Seeding ${RM_SEED_ITEMS.length} raw material items (${args.remote ? 'remote' : 'local'})...`);
  execSync(
    `node scripts/run-with-env.mjs npx wrangler d1 execute zeronerpdb ${remoteFlag} --file "${file}"`,
    { stdio: 'inherit', cwd: join(__dirname, '..') },
  );
  console.log('Raw material items seed complete.');
} finally {
  unlinkSync(file);
}
