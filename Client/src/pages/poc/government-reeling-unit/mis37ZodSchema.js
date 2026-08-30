import { z } from 'zod';
import { COST_DETAIL_FIELDS, FINANCIAL_BUDGET_ROWS } from './mis37Constants.js';

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative number' }
  );

const nonNegativeInteger = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (Number.isInteger(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative whole number' }
  );

const requiredText = z.string().min(1, 'Required');

const requiredSelect = z.string().min(1, 'Required');

const requiredId = z
  .union([z.string(), z.number()])
  .refine((val) => val !== '' && val != null && Number.isInteger(Number(val)) && Number(val) > 0, {
    message: 'Required',
  });

const requiredYear = z
  .union([z.string(), z.number()])
  .refine((val) => String(val).length === 4 && !Number.isNaN(Number(val)), {
    message: 'Enter a valid 4-digit year',
  });

export const mis37HeaderSchema = z.object({
  unitName: requiredText,
  unitCode: z.string().optional(),
  adCode: requiredText,
  disCode: requiredText,
  regCode: requiredText,
  region: requiredSelect,
  marketOfficeId: requiredId,
  month: requiredSelect,
  year: requiredYear,
});

const timePeriodSchema = z.object({
  ulm: nonNegativeNumber,
  dm: nonNegativeNumber,
  um: z.any().optional(),
});

const integerTimePeriodSchema = z.object({
  ulm: nonNegativeInteger,
  dm: nonNegativeInteger,
  um: z.any().optional(),
});

const financialCategorySchema = z.object({
  budgetOutlay: nonNegativeNumber,
  expenses: nonNegativeNumber,
  variance: z.any().optional(),
});

export const mis37Tab1Schema = z.object({
  achievementPhysical: z.object({
    target: timePeriodSchema,
    achieved: timePeriodSchema,
  }),
  achievementFinancial: z.object(
    Object.fromEntries(FINANCIAL_BUDGET_ROWS.map((row) => [row.key, financialCategorySchema]))
  ),
  productionDetails: z.object({
    devicesInstalled: nonNegativeInteger,
    productionCapacity: nonNegativeNumber,
    devicesInUse: nonNegativeInteger,
    daysWorked: integerTimePeriodSchema,
    mandaysUsed: integerTimePeriodSchema,
  }),
  stockParticulars: z.record(
    z.object({
      openingBalance: nonNegativeNumber,
      stockAdded: nonNegativeNumber,
      total: z.any().optional(),
      consumedSoldDisposed: nonNegativeNumber,
      closingBalance: z.any().optional(),
    })
  ),
  receipts: z.record(
    z.object({
      valueRs: timePeriodSchema,
    })
  ),
});

const percentageNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
    { message: 'Must be between 0 and 100' }
  );

function costDetailFieldSchema(percent = false) {
  return z.object({
    dm: percent ? percentageNumber : nonNegativeNumber,
    um: z.any().optional(),
  });
}

const costDetailsSchema = z.object(
  Object.fromEntries(
    COST_DETAIL_FIELDS.map((field) => [field.key, costDetailFieldSchema(Boolean(field.percent))])
  )
);


const cocoonStockStageSchema = z.object({
  qty: timePeriodSchema,
  value: timePeriodSchema,
});

export const mis37Tab2Schema = z.object({
  cocoonStockMovement: z.object({
    openingBalance: cocoonStockStageSchema,
    purchased: cocoonStockStageSchema,
    reeled: cocoonStockStageSchema,
    closingStock: cocoonStockStageSchema,
  }),
  nscExpenditure: z.object({
    reeledCocoonsValue: timePeriodSchema,
    wagesPaid: timePeriodSchema,
    fuelCost: timePeriodSchema,
    ebCharges: timePeriodSchema,
    maintenanceCharges: timePeriodSchema,
    transportCharges: timePeriodSchema,
    others: timePeriodSchema,
    total: timePeriodSchema.optional(),
  }),
  costDetails: costDetailsSchema,
  costOfProduction: z.object({
    totalNscExpenditure: timePeriodSchema.optional(),
    saleValueByeProducts: timePeriodSchema,
    netNscExpenditure: timePeriodSchema.optional(),
    costPerKgWithStaff: timePeriodSchema,
    costPerKgWithoutStaff: timePeriodSchema,
  }),
});

const readOnlyTimePeriodSchema = z.object({
  ulm: z.any().optional(),
  dm: z.any().optional(),
  um: z.any().optional(),
});

/** Every Section VII leaf row (Current Year and Previous Year alike) rolls forward monthly via U.L.M. */
const rollingQtyValueSchema = z.object({
  qty: timePeriodSchema,
  value: timePeriodSchema,
});

export const mis37Tab3Schema = z.object({
  stockDetailsKgs: z.record(
    z.object({
      openingBalance: nonNegativeNumber,
      purchase: nonNegativeNumber,
      total: z.any().optional(),
      soldIssued: nonNegativeNumber,
      closingBalance: z.any().optional(),
    })
  ),
  estimatedSaleValue: z.object({
    rawSilk: timePeriodSchema,
    byeProducts: readOnlyTimePeriodSchema,
    total: readOnlyTimePeriodSchema.optional(),
  }),
  actualReceiptDetails: z.object({
    silkSold: z.object({
      currentYear: rollingQtyValueSchema,
      previousYear: rollingQtyValueSchema,
    }),
    byeProductsSold: z.object({
      currentYear: rollingQtyValueSchema,
      previousYear: rollingQtyValueSchema,
    }),
  }),
  profitLoss: z.any().optional(),
});

export const mis37FullSchema = z.object({
  header: mis37HeaderSchema,
  tab1: mis37Tab1Schema,
  tab2: mis37Tab2Schema,
  tab3: mis37Tab3Schema,
  meta: z.any().optional(),
});

export const MIS37_TAB_SCHEMAS = {
  header: mis37HeaderSchema,
  tab1: mis37Tab1Schema,
  tab2: mis37Tab2Schema,
  tab3: mis37Tab3Schema,
};
