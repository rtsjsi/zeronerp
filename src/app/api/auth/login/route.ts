export const dynamic = "force-dynamic";

import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-response';
import { AuthService } from '@/lib/auth/service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Invalid email or password', 400);
    }

    const { token } = await AuthService.login(parsed.data.email, parsed.data.password);
    return apiSuccess({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    return apiError(message, 401);
  }
}
