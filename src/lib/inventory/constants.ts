import { z } from 'zod';

export const UOM_OPTIONS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'nos', label: 'Numbers (nos)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (l)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'm', label: 'Metre (m)' },
  { value: 'cm', label: 'Centimetre (cm)' },
  { value: 'sqm', label: 'Square Metre (sqm)' },
  { value: 'sqft', label: 'Square Feet (sqft)' },
  { value: 'box', label: 'Box' },
  { value: 'pkt', label: 'Packet (pkt)' },
  { value: 'bag', label: 'Bag' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'tonne', label: 'Tonne' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
] as const;

export const UOM_VALUES = UOM_OPTIONS.map((o) => o.value);

export const uomSchema = z.enum(UOM_VALUES as [string, ...string[]]);

export function getUomLabel(code: string): string {
  return UOM_OPTIONS.find((o) => o.value === code)?.label ?? code;
}
