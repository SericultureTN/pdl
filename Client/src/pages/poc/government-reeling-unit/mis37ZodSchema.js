import { z } from 'zod';
import { COST_DETAIL_FIELDS } from './mis37Constants.js';

const nonNegativeNumber = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val == null ? '' : String(val)))
  .refine(
    (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
    { message: 'Must be a non-negative number' }
  );

const requiredText = z.string().min(1, 'Required');

const requiredSelect = z.string().min(1, 'Required');

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
  month: requiredSelect,
  year: requiredYear,
});

const timePeriodSchema = z.object({
  ulm: nonNegativeNumber,
  dm: nonNegativeNumber,
  um: z.any().optional(),
});

const financialCategorySchema = z.object({
  budgetAnnual: nonNegativeNumber,
  budgetUlM: nonNegativeNumber,
  budgetDm: nonNegativeNumber,
  budgetUm: z.any().optional(),
  actualAnnual: z.any().optional(),
});

const financialRowSchema = z.object({
  outlay: financialCategorySchema,
  expenses: financialCategorySchema,
});

export const mis37Tab1Schema = z.object({
  achievementPhysical: z.object({
    target: timePeriodSchema,
    achieved: timePeriodSchema,
  }),
  achievementFinancial: z.object({
    salary: financialRowSchema,
    cocoonCost: financialRowSchema,
    wages: financialRowSchema,
    fuel: financialRowSchema,
    maintenance: financialRowSchema,
    others: financialRowSchema,
  }),
  productionDetails: z.object({
    devicesInstalled: nonNegativeNumber,
    productionCapacity: nonNegativeNumber,
    devicesInUse: nonNegativeNumber,
    daysWorked: nonNegativeNumber,
    mandaysUsed: nonNegativeNumber,
    cocoonUsedKg: nonNegativeNumber,
    valueOfCocoonUsed: nonNegativeNumber,
    valueOfFuelUsed: nonNegativeNumber,
    silkProducedQty: nonNegativeNumber,
    valueOfSilkProduced: nonNegativeNumber,
    renditaPercent: z.any().optional(),
  }),
  stockParticulars: z.record(
    z.object({
      openingBalance: nonNegativeNumber,
      stockAdded: nonNegativeNumber,
      underProcess: nonNegativeNumber,
      consumedSoldDisposed: nonNegativeNumber,
      closingBalance: z.any().optional(),
    })
  ),
  receipts: z.record(
    z.object({
      valueRs: timePeriodSchema,
      cash: timePeriodSchema,
    })
  ),
  silkSalesRealisation: z.record(
    z.object({
      qty: timePeriodSchema,
      value: timePeriodSchema,
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
    ulm: nonNegativeNumber,
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

const qtyValueSchema = z.object({
  qty: nonNegativeNumber,
  value: nonNegativeNumber,
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
    rawSilk: z.object({ dm: nonNegativeNumber, um: nonNegativeNumber }),
    byeProducts: z.object({ dm: nonNegativeNumber, um: nonNegativeNumber }),
    total: z.object({ dm: z.any().optional(), um: z.any().optional() }).optional(),
  }),
  actualReceiptDetails: z.object({
    silkSold: z.object({
      currentYear: qtyValueSchema,
      previousYear: qtyValueSchema,
      total: qtyValueSchema.partial().optional(),
    }),
    byeProductsSold: z.object({
      currentYear: qtyValueSchema,
      previousYear: qtyValueSchema,
      total: qtyValueSchema.partial().optional(),
    }),
    pendingWithExchange: z.object({
      currentYear: nonNegativeNumber,
      previousYear: nonNegativeNumber,
    }),
  }),
  machineryWorking: z.object({
    totalReelingMachines: nonNegativeNumber,
    workingMachines: nonNegativeNumber,
    daysUnitFunctioned: nonNegativeNumber,
    mandaysUsed: nonNegativeNumber,
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
