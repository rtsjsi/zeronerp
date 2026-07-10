export const dynamic = 'force-dynamic';

import { withAuth } from '@/lib/auth-middleware';
import { RecipeService } from '@/lib/services/recipe.service';
import { apiError, apiSuccess } from '@/lib/api-response';

export const POST = withAuth(async (_req, ctx) => {
  try {
    if (ctx.user.role === 'USER') {
      return apiError('Permission denied: admin access required', 403);
    }

    const result = await RecipeService.seedSampleRecipes(ctx.storeId, ctx.userId);

    return apiSuccess(result, 'Sample recipes seeded (idempotent)');
  } catch (err) {
    console.error('[Seed Sample Recipes Error]', err);
    return apiError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
});
