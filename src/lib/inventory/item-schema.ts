import { z } from 'zod';
import { uomSchema } from './constants';

export const ITEM_CATEGORY_OPTIONS = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'FINISHED_GOODS', label: 'Finished Goods' },
  { value: 'CONSUMABLES', label: 'Consumables' },
  { value: 'SERVICES', label: 'Services' },
] as const;

export const ITEM_TYPE_OPTIONS = [
  { value: 'STOCKABLE', label: 'Stockable' },
  { value: 'NON_STOCKABLE', label: 'Non-Stockable (Services)' },
] as const;

export const ITEM_CATEGORY_VALUES = ITEM_CATEGORY_OPTIONS.map((o) => o.value);
export const ITEM_TYPE_VALUES = ITEM_TYPE_OPTIONS.map((o) => o.value);

export const itemCategorySchema = z.enum(ITEM_CATEGORY_VALUES as [string, ...string[]]);
export const itemTypeSchema = z.enum(ITEM_TYPE_VALUES as [string, ...string[]]);

const optionalHsnSac = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || /^\d{4,8}$/.test(val), {
    message: 'HSN/SAC must be 4–8 digits',
  });

const priceField = z.number().min(0, 'Must be zero or positive');
const percentField = z.number().min(0).max(100, 'Must be between 0 and 100');

export const itemFormSchema = z.object({
  sku: z.string().trim().min(2, 'SKU must be at least 2 characters'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: itemCategorySchema,
  itemType: itemTypeSchema,
  uom: uomSchema,
  hsnSacCode: optionalHsnSac,
  cgstPercent: percentField,
  sgstPercent: percentField,
  igstPercent: percentField,
  reorderLevel: priceField,
  minStock: priceField,
  mrp: priceField,
  sellingPrice: priceField,
  purchasePrice: priceField,
  basePrice: priceField,
  isActive: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const createItemSchema = itemFormSchema;

export const updateItemSchema = itemFormSchema.partial();

export function getCategoryLabel(code: string): string {
  return ITEM_CATEGORY_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export function getItemTypeLabel(code: string): string {
  return ITEM_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

export function isLowStock(
  itemType: string,
  totalStock: number,
  reorderLevel: number,
  minStock: number,
): boolean {
  if (itemType !== 'STOCKABLE') return false;
  if (reorderLevel > 0 && totalStock <= reorderLevel) return true;
  if (minStock > 0 && totalStock <= minStock) return true;
  return false;
}

export const defaultItemFormValues: ItemFormValues = {
  sku: '',
  name: '',
  description: '',
  category: 'RAW_MATERIAL',
  itemType: 'STOCKABLE',
  uom: 'pcs',
  hsnSacCode: '',
  cgstPercent: 0,
  sgstPercent: 0,
  igstPercent: 0,
  reorderLevel: 0,
  minStock: 0,
  mrp: 0,
  sellingPrice: 0,
  purchasePrice: 0,
  basePrice: 0,
  isActive: true,
};

export function itemToFormValues(item: {
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  itemType: string;
  uom: string;
  hsnSacCode?: string | null;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  reorderLevel: number;
  minStock: number;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  basePrice: number;
  isActive: boolean;
}): ItemFormValues {
  return {
    sku: item.sku,
    name: item.name,
    description: item.description ?? '',
    category: item.category as ItemFormValues['category'],
    itemType: item.itemType as ItemFormValues['itemType'],
    uom: item.uom as ItemFormValues['uom'],
    hsnSacCode: item.hsnSacCode ?? '',
    cgstPercent: Number(item.cgstPercent),
    sgstPercent: Number(item.sgstPercent),
    igstPercent: Number(item.igstPercent),
    reorderLevel: Number(item.reorderLevel),
    minStock: Number(item.minStock),
    mrp: Number(item.mrp),
    sellingPrice: Number(item.sellingPrice),
    purchasePrice: Number(item.purchasePrice),
    basePrice: Number(item.basePrice),
    isActive: item.isActive,
  };
}

export function serializeItemPayload(data: ItemFormValues) {
  return {
    ...data,
    description: data.description?.trim() || undefined,
    hsnSacCode: data.hsnSacCode?.trim() || undefined,
  };
}
