import { z } from 'zod';

export const nonNegativeNumber = z
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

export const mis34HeaderSchema = z.object({
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

const periodPairSchema = z.object({
  duringMonth: nonNegativeNumber,
  uptoMonth: nonNegativeNumber,
});

const warpWeftPairSchema = z.object({
  warp: nonNegativeNumber,
  weft: nonNegativeNumber,
});

const periodWarpWeftSchema = z.object({
  duringMonth: warpWeftPairSchema,
  uptoMonth: warpWeftPairSchema,
});

const stockParticularRowSchema = z.object({
  openingBalance: nonNegativeNumber,
  purchasedQty: nonNegativeNumber,
  purchasedValue: nonNegativeNumber,
  ownProduction: nonNegativeNumber,
  underProcess: nonNegativeNumber,
  salesQty: nonNegativeNumber,
  salesValue: nonNegativeNumber,
  transferStock: nonNegativeNumber,
  closingBalance: z.any().optional(),
});

const receiptRowSchema = z.object({
  valueRs: nonNegativeNumber,
  cash: nonNegativeNumber,
});

const silkSalesRowSchema = z.object({
  qtyDm: nonNegativeNumber,
  qtyUm: nonNegativeNumber,
  valueDm: nonNegativeNumber,
  valueUm: nonNegativeNumber,
});

export const mis34Tab1Schema = z.object({
  achievementPhysical: z.object({
    rawProducedTarget: nonNegativeNumber,
    rawProducedAchieved: nonNegativeNumber,
    twistedSilkTarget: nonNegativeNumber,
    twistedSilkAchieved: nonNegativeNumber,
  }),
  achievementFinancial: z.object({
    salary: matrixRowSchema,
    cocoonCost: matrixRowSchema,
    rawSilkCost: matrixRowSchema,
    wages: matrixRowSchema,
    eb: matrixRowSchema,
    maintenance: matrixRowSchema,
    others: matrixRowSchema,
  }),
  productionDetails: z.record(nonNegativeNumber),
  stockParticulars: z.record(stockParticularRowSchema),
  receipts: z.record(receiptRowSchema),
  silkSalesRealisation: z.record(silkSalesRowSchema),
});

export const mis34Tab2Schema = z.object({
  rawSilkPurchased: z.object({
    openingBalance: periodPairSchema,
    purchasedReceived: z.object({
      duringMonth: nonNegativeNumber,
      uptoMonth: nonNegativeNumber,
      sourceUnit: z.string().optional(),
    }),
    issuedForTwisting: periodPairSchema,
    closingBalance: periodPairSchema.partial().optional(),
  }),
  machineStock: z.record(periodPairSchema),
  readySilkTwisting: z.record(periodWarpWeftSchema),
  nscExpenditure: z.record(z.object({
    duringMonth: nonNegativeNumber,
    uptoMonth: nonNegativeNumber,
  })),
});

export const mis34Tab3Schema = z.object({
  costOfProduction: z.object({
    totalNscExpenditure: z.any().optional(),
    lessTwistedWasteSale: nonNegativeNumber,
    netExpenditure: z.any().optional(),
    costPerKgReadySilk: z.any().optional(),
  }),
  estimatedReceiptDetails: z.record(nonNegativeNumber),
  actualReceiptDetails: z.record(z.any()),
  capacityOfUnit: z.record(nonNegativeNumber),
  profitLoss: z.any().optional(),
});

export const MIS34_TAB_SCHEMAS = {
  header: mis34HeaderSchema,
  tab1: mis34Tab1Schema,
  tab2: mis34Tab2Schema,
  tab3: mis34Tab3Schema,
};

export const mis34FormSchema = z.object({
  header: mis34HeaderSchema,
  tab1: mis34Tab1Schema,
  tab2: mis34Tab2Schema,
  tab3: mis34Tab3Schema,
  meta: z.any().optional(),
});
