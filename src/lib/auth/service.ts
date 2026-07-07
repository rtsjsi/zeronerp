import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { applicationUsers } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { newId, withTimestamps } from '@/db/helpers';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await db().query.applicationUsers.findFirst({
      where: and(
        eq(applicationUsers.email, email),
        eq(applicationUsers.isActive, true),
        eq(applicationUsers.isDeleted, false),
      ),
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'USER' | 'SUPER_ADMIN',
    });

    return { token, user };
  }

  static async createUser(data: {
    storeId: string | null;
    email: string;
    fullName: string;
    password: string;
    role?: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  }) {
    const passwordHash = await hashPassword(data.password);

    const [user] = await db()
      .insert(applicationUsers)
      .values(
        withTimestamps({
          id: newId(),
          storeId: data.storeId,
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          role: data.role || 'USER',
        }),
      )
      .returning();

    return user;
  }
}
