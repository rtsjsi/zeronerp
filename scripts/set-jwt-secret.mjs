import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const secret = randomBytes(32).toString('hex');

console.log('Uploading JWT_SECRET to Cloudflare Worker "zeronerp"...');

const result = spawnSync('npx', ['wrangler', 'secret', 'put', 'JWT_SECRET'], {
  input: secret,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
  env: process.env,
});

if (result.status !== 0) {
  console.error('Failed to set JWT_SECRET.');
  process.exit(result.status ?? 1);
}

console.log('JWT_SECRET set on Cloudflare. Redeploy the Worker if it is already live.');
