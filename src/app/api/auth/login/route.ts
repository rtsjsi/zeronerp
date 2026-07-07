export const dynamic = "force-dynamic";

import { z } from 'zod';
import { apiError, apiSuccess, parseRequestJson } from '@/lib/api-response';
import { AuthService } from '@/lib/auth/service';
import { usernameSchema } from '@/lib/auth/constants';

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await parseRequestJson<{ username?: string; password?: string }>(req);
    const parsed = loginSchema.safeParse({
      username: body.username?.trim(),
      password: body.password,
    });

    if (!parsed.success) {
      return apiError('Invalid username or password', 400);
    }

    const { token } = await AuthService.login(parsed.data.username, parsed.data.password);
    return apiSuccess({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    return apiError(message, 401);
  }
}
