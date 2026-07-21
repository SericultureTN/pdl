import { z } from 'zod';

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
  unitCode: requiredText,
  adCode: requiredText,
  disCode: requiredText,
  regCode: requiredText,
  month: requiredSelect,
  year: requiredYear,
});

const matrixRowSchema = z.object({
  outlayDm: nonNegativeNumber,
  outlayUm: nonNegativeNumber,
  outlayAnnual: nonNegativeNumber,
  expensesDm: nonNegativeNumber,
  expensesUm: nonNegativeNumber,
  expensesAnnual: nonNegativeNumber,
});

export const mis37Tab1Schema = z.object({
  achievementPhysical: z.object({
    targetKg: nonNegativeNumber,
    achievedKg: nonNegativeNumber,
  }),
  achievementFinancial: z.object({
    salary: matrixRowSchema,
    cocoonCost: matrixRowSchema,
    wages: matrixRowSchema,
    fuel: matrixRowSchema,
    maintenance: matrixRowSchema,
    others: matrixRowSchema,
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
      stockDisposedQty: nonNegativeNumber,
      stockDisposedValue: nonNegativeNumber,
      closingBalance: z.any().optional(),
    })
  ),
  receipts: z.record(
    z.object({
      valueRs: nonNegativeNumber,
      cash: nonNegativeNumber,
    })
  ),
  silkSalesRealisation: z.record(
    z.object({
      qtyDm: nonNegativeNumber,
      qtyUm: nonNegativeNumber,
      valueDm: nonNegativeNumber,
      valueUm: nonNegativeNumber,
    })
  ),
});

const cocoonStockRowSchema = z.object({
  csrDuringQty: nonNegativeNumber,
  csrDuringValue: nonNegativeNumber,
  cbDuringQty: nonNegativeNumber,
  cbDuringValue: nonNegativeNumber,
  csrUptoQty: nonNegativeNumber,
  csrUptoValue: nonNegativeNumber,
  cbUptoQty: nonNegativeNumber,
  cbUptoValue: nonNegativeNumber,
});

export const mis37Tab2Schema = z.object({
  cocoonStockMovement: z.object({
    openingBalance: cocoonStockRowSchema,
    purchased: cocoonStockRowSchema,
    reeled: cocoonStockRowSchema,
    closingStock: cocoonStockRowSchema,
  }),
  nscExpenditure: z.object({
    reeledCocoonsValue: nonNegativeNumber,
    wagesPaid: nonNegativeNumber,
    fuelCost: nonNegativeNumber,
    ebCharges: nonNegativeNumber,
    maintenanceCharges: nonNegativeNumber,
    transportCharges: nonNegativeNumber,
    others: nonNegativeNumber,
    total: z.any().optional(),
  }),
  costDetails: z.record(nonNegativeNumber),
  costOfProduction: z.object({
    totalNscExpenditure: z.any().optional(),
    saleValueByeProducts: nonNegativeNumber,
    netNscExpenditure: z.any().optional(),
    costPerKgWithStaff: z.any().optional(),
    costPerKgWithoutStaff: z.any().optional(),
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
