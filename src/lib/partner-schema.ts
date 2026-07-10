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

export const partnerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  pan: optionalPanSchema,
  gstn: optionalGstnSchema,
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export type PartnerInput = PartnerFormValues;

export function normalizePartnerInput(data: PartnerInput) {
  return {
    name: data.name.trim(),
    contactName: data.contactName?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    address: data.address?.trim() || null,
    ...normalizePartnerTaxFields(data),
  };
}
