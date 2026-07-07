/**
 * Reset super admin password on remote D1.
 * Usage: npm run db:reset-admin -- --password NewPassword123
 */

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const SUPER_ADMIN_USERNAME = 'super_admin';
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function parseArgs(argv) {
  const args = { remote: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--local') args.remote = false;
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
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(new Uint8Array(derived))}`;
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const args = parseArgs(process.argv.slice(2));
const password = args.password || 'ZeronAdmin2026';
const passwordHash = await hashPassword(password);
const now = new Date().toISOString();

const sql = `UPDATE ApplicationUsers SET passwordHash = '${sqlEscape(passwordHash)}', updatedAt = '${now}' WHERE username = '${SUPER_ADMIN_USERNAME}' AND role = 'SUPER_ADMIN';`;
const file = join(tmpdir(), `zeronerp-reset-${Date.now()}.sql`);
writeFileSync(file, sql, 'utf8');

const target = args.remote ? 'zeronerpdb --remote' : 'zeronerpdb --local';
console.log(`Resetting password for ${SUPER_ADMIN_USERNAME} on ${args.remote ? 'remote' : 'local'} D1...`);

try {
  execSync(`npx wrangler d1 execute ${target} --file "${file}"`, { stdio: 'inherit' });
  console.log(`Done. Password is now: ${password}`);
} finally {
  unlinkSync(file);
}
