import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applicationUsers } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { SUPER_ADMIN_USERNAME } from '@/lib/auth/constants';
import { newId, withTimestamps } from '@/db/helpers';

export class AuthService {
  static async login(username: string, password: string) {
    const user = await db().query.applicationUsers.findFirst({
      where: and(
        eq(applicationUsers.username, username),
        eq(applicationUsers.isActive, true),
        eq(applicationUsers.isDeleted, false),
      ),
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid username or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid username or password');
    }

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      role: user.role as 'ADMIN' | 'USER' | 'SUPER_ADMIN',
    });

    return { token, user };
  }

  static async createUser(data: {
    storeId: string | null;
    username: string;
    fullName: string;
    password: string;
    role?: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  }) {
    const role = data.role || 'USER';

    if (role === 'SUPER_ADMIN' && data.username !== SUPER_ADMIN_USERNAME) {
      throw new Error(`Super admin username must be "${SUPER_ADMIN_USERNAME}"`);
    }

    const passwordHash = await hashPassword(data.password);

    const [user] = await db()
      .insert(applicationUsers)
      .values(
        withTimestamps({
          id: newId(),
          storeId: data.storeId,
          username: data.username,
          fullName: data.fullName,
          passwordHash,
          role,
        }),
      )
      .returning();

    return user;
  }
}
