import 'server-only';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/edge';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  // Use the standard pg Pool. 
  // Cloudflare Workers now support this natively via 'connect'
  const pool = new Pool({ 
    connectionString,
    max: 1 // Crucial for serverless to prevent connection exhaustion
  });
  
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
