export type SampleRecipeDefinition = {
  finishedGoodName: string;
  outputQuantity: number;
  lines: Array<{ rawMaterialName: string; quantity: number }>;
};
