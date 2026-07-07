import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applicationUsers, stores } from '@/db/schema';
import { AuthService } from '@/lib/auth/service';
import { newId, withTimestamps } from '@/db/helpers';

export class SuperAdminService {
  static async getStores() {
    return db().query.stores.findMany({
      where: eq(stores.isDeleted, false),
      orderBy: desc(stores.createdAt),
    });
  }

  static async getStoreById(id: string) {
    const store = await db().query.stores.findFirst({
      where: and(eq(stores.id, id), eq(stores.isDeleted, false)),
    });

    if (!store) throw new Error('Store not found');
    return store;
  }

  static async createStore(data: {
    name: string;
    address?: string;
    gstn?: string;
    contactNumber?: string;
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const [store] = await db()
      .insert(stores)
      .values(
        withTimestamps({
          id: newId(),
          name: data.name,
          slug,
          address: data.address,
          gstn: data.gstn,
          contactNumber: data.contactNumber,
        }),
      )
      .returning();

    return store;
  }

  static async getUsersForStore(storeId: string) {
    return db().query.applicationUsers.findMany({
      where: and(eq(applicationUsers.storeId, storeId), eq(applicationUsers.isDeleted, false)),
      orderBy: desc(applicationUsers.createdAt),
    });
  }

  static async createUserForStore(
    storeId: string,
    data: { username: string; fullName: string; password?: string; role: 'ADMIN' | 'USER' },
  ) {
    return AuthService.createUser({
      storeId,
      username: data.username,
      fullName: data.fullName,
      password: data.password || 'Temporary123!',
      role: data.role,
    });
  }
}
