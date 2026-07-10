import type { SampleRecipeDefinition } from './sample-recipes.types';
import sampleRecipesJson from './sample-recipes.json';

export type { SampleRecipeDefinition } from './sample-recipes.types';

/** Sample BOMs keyed by finished good item name (idempotent seed). */
export const SAMPLE_RECIPES = sampleRecipesJson as SampleRecipeDefinition[];
