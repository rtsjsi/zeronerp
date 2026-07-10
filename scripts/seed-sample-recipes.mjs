/**
 * Seed sample production recipes into D1 for all active stores.
 *
 * Requires FG and RM items to exist (run db:seed-fg-items and db:seed-rm-items first).
 *
 * Usage:
 *   npm run db:seed-sample-recipes
 *   npm run db:seed-sample-recipes -- --remote
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

/** @type {import('../src/lib/inventory/sample-recipes').SampleRecipeDefinition[]} */
const SAMPLE_RECIPES = JSON.parse(
  readFileSync(join(__dirname, '../src/lib/inventory/sample-recipes.json'), 'utf8'),
);

function parseArgs(argv) {
  return { remote: argv.includes('--remote') };
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function buildRecipeSql(sample, now) {
  const fgName = sqlEscape(sample.finishedGoodName);
  const recipeId = randomUUID();
  const statements = [];

  statements.push(`INSERT INTO Recipe (id, storeId, name, finishedItemId, outputQuantity, isActive, isDeleted, createdAt, updatedAt)
SELECT '${recipeId}', s.id, fg.name, fg.id, ${sample.outputQuantity}, 1, 0, '${now}', '${now}'
FROM Stores s
INNER JOIN Item fg ON fg.storeId = s.id AND fg.name = '${fgName}' AND fg.isDeleted = 0
WHERE s.isDeleted = 0 AND s.isActive = 1
AND NOT EXISTS (
  SELECT 1 FROM Recipe r WHERE r.storeId = s.id AND r.finishedItemId = fg.id AND r.isDeleted = 0
);`);

  for (const line of sample.lines) {
    const rmName = sqlEscape(line.rawMaterialName);
    const lineId = randomUUID();
    statements.push(`INSERT INTO RecipeLine (id, storeId, recipeId, rawItemId, quantity)
SELECT '${lineId}', r.storeId, r.id, rm.id, ${line.quantity}
FROM Recipe r
INNER JOIN Item fg ON fg.id = r.finishedItemId AND fg.name = '${fgName}' AND fg.isDeleted = 0
INNER JOIN Item rm ON rm.storeId = r.storeId AND rm.name = '${rmName}' AND rm.isDeleted = 0
WHERE r.isDeleted = 0
AND NOT EXISTS (
  SELECT 1 FROM RecipeLine rl WHERE rl.recipeId = r.id AND rl.rawItemId = rm.id
);`);
  }

  return statements;
}

const args = parseArgs(process.argv.slice(2));
const remoteFlag = args.remote ? '--remote' : '';
const now = new Date().toISOString();

const insertStatements = SAMPLE_RECIPES.flatMap((sample) => buildRecipeSql(sample, now));
const sql = insertStatements.join('\n');

const file = join(tmpdir(), `zeronerp-seed-recipes-${Date.now()}.sql`);
writeFileSync(file, sql, 'utf8');

try {
  console.log(`Seeding ${SAMPLE_RECIPES.length} sample recipe(s) (${args.remote ? 'remote' : 'local'})...`);
  execSync(
    `node scripts/run-with-env.mjs npx wrangler d1 execute zeronerpdb ${remoteFlag} --file "${file}"`,
    { stdio: 'inherit', cwd: join(__dirname, '..') },
  );
  console.log('Sample recipes seed complete.');
} finally {
  unlinkSync(file);
}
