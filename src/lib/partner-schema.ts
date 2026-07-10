import { z } from 'zod';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const optionalPanSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || PAN_REGEX.test(val.toUpperCase()), {
    message: 'PAN must be 10 characters (e.g. ABCDE1234F)',
  });

export const optionalGstnSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((val) => !val || GSTIN_REGEX.test(val.toUpperCase()), {
    message: 'GSTN must be a valid 15-character GSTIN',
  });

export function normalizePartnerTaxFields(data: { pan?: string; gstn?: string }) {
  return {
    pan: data.pan?.trim().toUpperCase() || null,
    gstn: data.gstn?.trim().toUpperCase() || null,
  };
}
