export const dynamic = "force-dynamic";
import { and, desc, eq } from 'drizzle-orm';
import { withAuth } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { applicationUsers } from '@/db/schema';
import { AuthService } from '@/lib/auth/service';
import { usernameSchema } from '@/lib/auth/constants';
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const userSchema = z.object({
  username: usernameSchema,
  fullName: z.string().min(2),
  password: z.string().min(6),
});

export const GET = withAuth(async (_req, ctx) => {
  const users = await db().query.applicationUsers.findMany({
    where: and(
      eq(applicationUsers.storeId, ctx.storeId),
      eq(applicationUsers.isDeleted, false),
    ),
    orderBy: desc(applicationUsers.createdAt),
  });

  return apiSuccess(users);
});

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid data", 400);
    }

    const { username, fullName, password } = parsed.data;

    const user = await AuthService.createUser({
      storeId: ctx.storeId,
      username,
      fullName,
      password,
      role: 'USER',
    });

    return apiSuccess(user, "User created successfully", 201);
  } catch (err: any) {
    console.error("[Admin Users API Error]", err);
    return apiError(err.message || "Internal server error", 500);
  }
});
