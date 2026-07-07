import { spawnSync } from 'node:child_process';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const [, , ...args] = process.argv;
if (args.length === 0) {
  console.error('Usage: node scripts/run-with-env.mjs <command> [args...]');
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
