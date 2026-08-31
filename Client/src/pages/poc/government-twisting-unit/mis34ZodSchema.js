import { z } from 'zod';
import { UNIT_TABLE_GROUPS } from './mis34Constants.js';

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative number' }
  );

function tableShape(fields) {
  return Object.fromEntries(
    fields.flatMap(({ ulmKey, dmKey, umKey }) => [
      [ulmKey, nonNegativeNumber],
      [dmKey, nonNegativeNumber],
      [umKey, z.any().optional()], // always derived (ulm + dm), never entered directly
    ])
  );
}

const productionDetailsShape = {
  spindlesInstalled: nonNegativeNumber,
  installedProductionCapacity: nonNegativeNumber,
  spindlesInUse: nonNegativeNumber,
};

const unitShapeFromGroups = Object.fromEntries(
  UNIT_TABLE_GROUPS.map(({ path, fields }) => [
    path,
    path === 'productionDetails'
      ? z.object({ ...productionDetailsShape, ...tableShape(fields) })
      : z.object(tableShape(fields)),
  ])
);

export const mis34UnitSchema = z.object({
  id: z.string(),
  unitName: z.string().min(1, 'Unit name is required'),
  unitCode: z.string().optional(),
  ...unitShapeFromGroups,
});

export const mis34HeaderSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  marketOfficeId: z.union([z.string(), z.number()]).refine((val) => String(val).length > 0, {
    message: 'Office is required',
  }),
  month: z.string().min(1, 'Month is required'),
  year: z
    .union([z.string(), z.number()])
    .refine((val) => String(val).length === 4 && !Number.isNaN(Number(val)), {
      message: 'Enter a valid 4-digit year',
    }),
});

export const mis34FormSchema = z.object({
  header: mis34HeaderSchema,
  units: z.array(mis34UnitSchema).min(1, 'Add at least one twisting unit'),
});

export function validateUnit(unit) {
  return mis34UnitSchema.safeParse(unit);
}
