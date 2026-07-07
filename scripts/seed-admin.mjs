/**
 * Bootstrap script: create the first SUPER_ADMIN user in local D1.
 *
 * Usage:
 *   npm run db:seed-admin -- --email admin@example.com --password secret123 --name "Super Admin"
 *   npm run db:seed-admin -- --remote --email admin@example.com --password secret123
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function parseArgs(argv) {
  const args = { remote: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--remote') {
      args.remote = true;
      continue;
    }
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(new Uint8Array(derived))}`;
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const args = parseArgs(process.argv.slice(2));
const email = args.email || 'admin@zeronerp.local';
const password = args.password || 'Admin123!';
const fullName = args.name || 'Super Admin';

const id = randomUUID();
const now = new Date().toISOString();
const passwordHash = await hashPassword(password);

const sql = `INSERT INTO ApplicationUsers (id, storeId, email, fullName, passwordHash, role, isActive, isDeleted, createdAt, updatedAt) VALUES ('${sqlEscape(id)}', NULL, '${sqlEscape(email)}', '${sqlEscape(fullName)}', '${sqlEscape(passwordHash)}', 'SUPER_ADMIN', 1, 0, '${now}', '${now}');`;

const file = join(tmpdir(), `zeronerp-seed-${Date.now()}.sql`);
writeFileSync(file, sql, 'utf8');

const target = args.remote ? 'zeronerpdb --remote' : 'zeronerpdb --local';
console.log(`Creating SUPER_ADMIN on ${args.remote ? 'remote' : 'local'} D1: ${email}`);
try {
  execSync(`npx wrangler d1 execute ${target} --file "${file}"`, { stdio: 'inherit' });
  console.log('Done.');
} finally {
  unlinkSync(file);
}
