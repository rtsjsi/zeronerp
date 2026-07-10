/**
 * Seed sample vendors and customers into D1 for all active stores.
 *
 * Usage:
 *   npm run db:seed-partners
 *   npm run db:seed-partners -- --remote
 */

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { loadEnvLocal } from './load-env.mjs';

loadEnvLocal();

const __dirname = dirname(fileURLToPath(import.meta.url));

const VENDORS = [
  {
    name: 'Gujarat Seeds Suppliers',
    contactName: 'Ramesh Patel',
    email: 'ramesh@gujaratseeds.in',
    phone: '+91 98765 43210',
    address: 'Ring Road, Rajkot, Gujarat 360002',
    pan: 'AABCG1234F',
    gstn: '24AABCG1234F1Z5',
  },
  {
    name: 'PackWell Industries',
    contactName: 'Suresh Mehta',
    email: 'orders@packwell.in',
    phone: '+91 98250 11223',
    address: 'GIDC Estate, Ahmedabad, Gujarat 382445',
    pan: 'AABCP5678K',
    gstn: '24AABCP5678K1Z8',
  },
];

const CUSTOMERS = [
  {
    name: 'Shree Kirana Store',
    contactName: 'Kiran Shah',
    email: 'kiran@shreekirana.in',
    phone: '+91 98980 55667',
    address: 'Station Road, Jamnagar, Gujarat 361001',
    pan: 'AABCS9012L',
    gstn: '24AABCS9012L1Z3',
  },
  {
    name: 'Patel Wholesale Traders',
    contactName: 'Jayesh Patel',
    email: 'sales@patelwholesale.in',
    phone: '+91 97240 88990',
    address: 'Market Yard, Surat, Gujarat 395002',
    pan: 'AABCP3456M',
    gstn: '24AABCP3456M1Z1',
  },
];

function parseArgs(argv) {
  return { remote: argv.includes('--remote') };
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

function buildVendorInsert(vendor, now) {
  const name = sqlEscape(vendor.name);
  const contactName = sqlEscape(vendor.contactName);
  const email = sqlEscape(vendor.email);
  const phone = sqlEscape(vendor.phone);
  const address = sqlEscape(vendor.address);
  const pan = sqlEscape(vendor.pan);
  const gstn = sqlEscape(vendor.gstn);

  return `INSERT INTO Vendor (id, storeId, name, contactName, email, phone, address, pan, gstn, customFields, isDeleted, createdBy, createdAt, updatedAt)
SELECT lower(hex(randomblob(16))), s.id, '${name}', '${contactName}', '${email}', '${phone}', '${address}', '${pan}', '${gstn}', '{}', 0, NULL, '${now}', '${now}'
FROM Stores s
WHERE s.isDeleted = 0 AND s.isActive = 1
AND NOT EXISTS (
  SELECT 1 FROM Vendor v WHERE v.storeId = s.id AND v.name = '${name}' AND v.isDeleted = 0
);`;
}

function buildCustomerInsert(customer, now) {
  const name = sqlEscape(customer.name);
  const contactName = sqlEscape(customer.contactName);
  const email = sqlEscape(customer.email);
  const phone = sqlEscape(customer.phone);
  const address = sqlEscape(customer.address);
  const pan = sqlEscape(customer.pan);
  const gstn = sqlEscape(customer.gstn);

  return `INSERT INTO Customer (id, storeId, name, contactName, email, phone, address, pan, gstn, customFields, isDeleted, createdBy, createdAt, updatedAt)
SELECT lower(hex(randomblob(16))), s.id, '${name}', '${contactName}', '${email}', '${phone}', '${address}', '${pan}', '${gstn}', '{}', 0, NULL, '${now}', '${now}'
FROM Stores s
WHERE s.isDeleted = 0 AND s.isActive = 1
AND NOT EXISTS (
  SELECT 1 FROM Customer c WHERE c.storeId = s.id AND c.name = '${name}' AND c.isDeleted = 0
);`;
}

const args = parseArgs(process.argv.slice(2));
const remoteFlag = args.remote ? '--remote' : '';
const now = new Date().toISOString();

const insertStatements = [
  ...VENDORS.map((vendor) => buildVendorInsert(vendor, now)),
  ...CUSTOMERS.map((customer) => buildCustomerInsert(customer, now)),
];
const sql = insertStatements.join('\n');

const file = join(tmpdir(), `zeronerp-seed-partners-${Date.now()}.sql`);
writeFileSync(file, sql, 'utf8');

try {
  console.log(
    `Seeding ${VENDORS.length} vendors and ${CUSTOMERS.length} customers (${args.remote ? 'remote' : 'local'})...`,
  );
  execSync(
    `node scripts/run-with-env.mjs npx wrangler d1 execute zeronerpdb ${remoteFlag} --file "${file}"`,
    { stdio: 'inherit', cwd: join(__dirname, '..') },
  );
  console.log('Partner seed complete.');
} finally {
  unlinkSync(file);
}
