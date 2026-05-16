import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/edge';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  // Choose the correct driver based on the environment
  // Cloudflare Workers (workerd) require pg-cloudflare
  // Node.js (build/dev) requires standard pg
  let pool;
  if (process.env.NEXT_RUNTIME === 'edge' || typeof (globalThis as any).WebSocket !== 'undefined') {
    // We are on Cloudflare or an Edge runtime
    const { Pool } = require('pg-cloudflare');
    pool = new Pool({ connectionString });
  } else {
    // We are in Node.js (during build or local dev)
    const { Pool } = require('pg');
    pool = new Pool({ connectionString });
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  }).$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            args.where = { isDeleted: false, ...args.where };
          }
          return query(args);
        },
        async findUnique({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            args.where = { isDeleted: false, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            args.where = { isDeleted: false, ...args.where };
          }
          return query(args);
        },
        async count({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            args.where = { isDeleted: false, ...args.where };
          }
          return query(args);
        },
        async delete({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            return query({
              ...args,
              data: { isDeleted: true },
            } as any);
          }
          return query(args);
        },
        async deleteMany({ model, args, query }: any) {
          if (['Tenant', 'User', 'CustomFieldDefinition'].includes(model)) {
            return query({
              ...args,
              data: { isDeleted: true },
            } as any);
          }
          return query(args);
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
