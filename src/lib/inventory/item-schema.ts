import { z } from 'zod';
import { normalizeUomCode, uomCodeSchema } from './constants';

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

export const ITEM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
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
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  category: itemCategorySchema,
  itemType: itemTypeSchema,
  uom: uomCodeSchema,
  hsnSacCode: optionalHsnSac,
  gstRate: percentField,
  reorderLevel: priceField,
  minStock: priceField,
  cost: priceField,
  mrp: priceField,
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
  name: '',
  category: 'RAW_MATERIAL',
  itemType: 'STOCKABLE',
  uom: 'PCS',
  hsnSacCode: '',
  gstRate: 0,
  reorderLevel: 0,
  minStock: 0,
  cost: 0,
  mrp: 0,
  isActive: true,
};

export function itemToFormValues(item: {
  name: string;
  category: string;
  itemType: string;
  uom: string;
  hsnSacCode?: string | null;
  gstRate: number;
  reorderLevel: number;
  minStock: number;
  cost: number;
  mrp: number;
  isActive: boolean;
}): ItemFormValues {
  return {
    name: item.name,
    category: item.category as ItemFormValues['category'],
    itemType: item.itemType as ItemFormValues['itemType'],
    uom: normalizeUomCode(item.uom),
    hsnSacCode: item.hsnSacCode ?? '',
    gstRate: Number(item.gstRate),
    reorderLevel: Number(item.reorderLevel),
    minStock: Number(item.minStock),
    cost: Number(item.cost),
    mrp: Number(item.mrp),
    isActive: item.isActive,
  };
}

export function serializeItemPayload(data: ItemFormValues) {
  return {
    ...data,
    hsnSacCode: data.hsnSacCode?.trim() || undefined,
  };
}
