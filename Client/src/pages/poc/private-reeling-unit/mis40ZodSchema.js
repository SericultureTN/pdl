import { z } from 'zod';

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative number' }
  );

export const mis40RowSchema = z.object({
  id: z.string(),
  beneficiaryName: z.string().min(1, 'Beneficiary name is required'),
  place: z.string().min(1, 'Place is required'),
  installedUnit: nonNegativeNumber,
  installedDevice: nonNegativeNumber,
  functionalUnit: nonNegativeNumber,
  functionalDevice: nonNegativeNumber,
  cocoonPurchasedDm: nonNegativeNumber,
  cocoonPurchasedUm: nonNegativeNumber,
  cocoonConsumedDm: nonNegativeNumber,
  cocoonConsumedUm: nonNegativeNumber,
  silkProductionDm: nonNegativeNumber,
  silkProductionUm: nonNegativeNumber,
  rendittaDm: z.any().optional(),
  rendittaUm: z.any().optional(),
  functionalDaysDm: nonNegativeNumber,
  functionalDaysUm: nonNegativeNumber,
  disposalAseDm: nonNegativeNumber,
  disposalAseUm: nonNegativeNumber,
  disposalPrivateDm: nonNegativeNumber,
  disposalPrivateUm: nonNegativeNumber,
  remarks: z.string().optional(),
});

export const mis40HeaderSchema = z.object({
  assistantDirectorName: z.string().min(1, 'Assistant Director name is required'),
  pdlNo: z.string(),
  month: z.string().min(1, 'Month is required'),
  year: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).length === 4 && !Number.isNaN(Number(val)), {
      message: 'Enter a valid 4-digit year',
    }),
});

export const mis40CategorySchema = z.object({
  rows: z.array(mis40RowSchema).min(1, 'Add at least one beneficiary row'),
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
    signedAt: z.string().optional(),
  }).optional(),
});

export function validateRow(row) {
  return mis40RowSchema.safeParse(row);
}

export function validateCategoryRows(rows) {
  return z.array(mis40RowSchema).safeParse(rows);
}
