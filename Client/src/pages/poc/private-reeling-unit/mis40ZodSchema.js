import { z } from 'zod';
import { KG_FIELD_GROUPS } from './mis40Constants.js';

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative number' }
  );

const kgFieldShape = Object.fromEntries(
  KG_FIELD_GROUPS.flatMap(({ ulmKey, dmKey, umKey }) => [
    [ulmKey, nonNegativeNumber],
    [dmKey, nonNegativeNumber],
    [umKey, z.any().optional()], // always derived (ulm + dm), never entered directly
  ])
);

export const mis40RowSchema = z.object({
  id: z.string(),
  beneficiaryName: z.string().min(1, 'Beneficiary name is required'),
  place: z.string().optional(),
  installedUnit: nonNegativeNumber,
  installedDevice: nonNegativeNumber,
  functionalUnit: nonNegativeNumber,
  functionalDevice: nonNegativeNumber,
  ...kgFieldShape,
  rendittaDm: z.any().optional(),
  rendittaUm: z.any().optional(),
});

export const mis40HeaderSchema = z.object({
  pdlNo: z.string(),
  regionId: z.union([z.string(), z.number()]).refine((val) => String(val).length > 0, {
    message: 'Region is required',
  }),
  marketOfficeId: z.union([z.string(), z.number()]).refine((val) => String(val).length > 0, {
    message: 'Market Office is required',
  }),
  month: z.string().min(1, 'Month is required'),
  year: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).length === 4 && !Number.isNaN(Number(val)), {
      message: 'Enter a valid 4-digit year',
    }),
});

export const mis40CategorySchema = z.object({
  rows: z.array(mis40RowSchema).min(1, 'Add at least one beneficiary'),
});

export const mis40FormSchema = z.object({
  header: mis40HeaderSchema,
  categories: z.object({
    arm: mis40CategorySchema,
    charka: mis40CategorySchema,
    cottage: mis40CategorySchema,
    mrm: mis40CategorySchema,
  }),
  signOff: z.object({
    extensionOfficer: z.string().optional(),
    signedAt: z.string().nullable().optional(),
  }).optional(),
});

export function validateRow(row) {
  return mis40RowSchema.safeParse(row);
}

export function validateCategoryRows(rows) {
  return z.array(mis40RowSchema).safeParse(rows);
}
