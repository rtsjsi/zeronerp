/**
 * Cloudflare D1 Database Client (Drizzle ORM)
 */

import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as schema from '@/db/schema';

export type AppDatabase = DrizzleD1Database<typeof schema>;

let _db: AppDatabase | null = null;

function getD1Binding(): D1Database {
  const context = getCloudflareContext();
  const binding = context?.env?.DB;

  if (!binding) {
    throw new Error(
      'D1 binding "DB" not found. Add d1_databases to wrangler.jsonc and run db:migrate:local.',
    );
  }

  return binding;
}

export function db(): AppDatabase {
  if (_db) return _db;
  _db = drizzle(getD1Binding(), { schema });
  return _db;
}

export default db;
