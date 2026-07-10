import { z } from 'zod';

/** Stored in DB as exactly 3 uppercase characters. */
export const UOM_OPTIONS = [
  { value: 'PCS', label: 'Pieces (PCS)' },
  { value: 'NOS', label: 'Numbers (NOS)' },
  { value: 'KGM', label: 'Kilogram (KGM)' },
  { value: 'GRM', label: 'Gram (GRM)' },
  { value: 'LTR', label: 'Litre (LTR)' },
  { value: 'MLT', label: 'Millilitre (MLT)' },
  { value: 'MTR', label: 'Metre (MTR)' },
  { value: 'CMT', label: 'Centimetre (CMT)' },
  { value: 'SQM', label: 'Square Metre (SQM)' },
  { value: 'SQF', label: 'Square Feet (SQF)' },
  { value: 'BOX', label: 'Box (BOX)' },
  { value: 'PKT', label: 'Packet (PKT)' },
  { value: 'BAG', label: 'Bag (BAG)' },
  { value: 'SET', label: 'Set (SET)' },
  { value: 'PRS', label: 'Pair (PRS)' },
  { value: 'DZN', label: 'Dozen (DZN)' },
  { value: 'TNE', label: 'Tonne (TNE)' },
  { value: 'ROL', label: 'Roll (ROL)' },
  { value: 'SHT', label: 'Sheet (SHT)' },
] as const;

export const UOM_VALUES = UOM_OPTIONS.map((o) => o.value);

/** Maps legacy lowercase / variable-length codes to 3-char caps values. */
export const LEGACY_UOM_MAP: Record<string, (typeof UOM_OPTIONS)[number]['value']> = {
  pcs: 'PCS',
  nos: 'NOS',
  kg: 'KGM',
  g: 'GRM',
  l: 'LTR',
  ml: 'MLT',
  m: 'MTR',
  cm: 'CMT',
  sqm: 'SQM',
  sqft: 'SQF',
  box: 'BOX',
  pkt: 'PKT',
  bag: 'BAG',
  set: 'SET',
  pair: 'PRS',
  dozen: 'DZN',
  tonne: 'TNE',
  roll: 'ROL',
  sheet: 'SHT',
};

export function normalizeUomCode(code: string): (typeof UOM_OPTIONS)[number]['value'] {
  const trimmed = code.trim();
  if ((UOM_VALUES as readonly string[]).includes(trimmed)) {
    return trimmed as (typeof UOM_OPTIONS)[number]['value'];
  }

  const legacy = LEGACY_UOM_MAP[trimmed.toLowerCase()];
  if (legacy) return legacy;

  return trimmed.toUpperCase() as (typeof UOM_OPTIONS)[number]['value'];
}

/** Valid stored UOM codes — use in forms, API validation, and typed outputs. */
export const uomCodeSchema = z.enum(UOM_VALUES as [string, ...string[]]);

export type UomCode = z.infer<typeof uomCodeSchema>;

/** @deprecated Use uomCodeSchema — legacy normalization happens in InventoryService. */
export const uomSchema = uomCodeSchema;

export function getUomLabel(code: string): string {
  const normalized = normalizeUomCode(code);
  return UOM_OPTIONS.find((o) => o.value === normalized)?.label ?? normalized;
}

/** Display label for a stored UOM code; use everywhere UOM is shown to users. */
export function formatUom(code?: string | null): string {
  if (!code) return '—';
  return getUomLabel(code);
}
