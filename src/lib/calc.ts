// ---------------------------------------------------------------------------
// Calculation engine. Pure functions only. No rounding inside the math —
// round only for display (see lib/format.ts).
//
// Model (years 2017 -> 2018, inflation pushes sales UP a bracket):
//   inputs : tax2017Paid (total tax already paid in 2017), salesBefore (2017
//            sales before inflation), inflationRate (default 0.152)
//   taxBefore = salesBefore * bracketRate(salesBefore)
//   salesWith = salesBefore * (1 + inflationRate)
//   taxWith   = salesWith   * bracketRate(salesWith)
//   difference (Garaagaruma) = taxWith - taxBefore
//   tax2018  (Taaksii Bara 2018) = tax2017Paid + difference
// ---------------------------------------------------------------------------

export interface CalcResult {
  tax2017Paid: number;
  salesBefore: number;
  inflationRate: number;
  rateBefore: number;
  taxBefore: number;
  salesWith: number;
  rateWith: number;
  taxWith: number;
  difference: number;
  tax2018: number;
}

/**
 * Sales-tax bracket rate, chosen by the sales amount. Assumption: amounts
 * >= 2,000,000 default to the top 9% (table doesn't define higher).
 */
export function bracketRate(amount: number): number {
  if (amount <= 100000) return 0.02;
  if (amount <= 500000) return 0.03;
  if (amount <= 1000000) return 0.05;
  if (amount <= 1500000) return 0.07;
  return 0.09; // 1,500,001 and above
}

export function computeResult(
  tax2017Paid: number,
  salesBefore: number,
  inflationRate: number
): CalcResult {
  const rateBefore = bracketRate(salesBefore);
  const taxBefore = salesBefore * rateBefore;

  const salesWith = salesBefore * (1 + inflationRate);
  const rateWith = bracketRate(salesWith);
  const taxWith = salesWith * rateWith;

  const difference = taxWith - taxBefore;
  const tax2018 = tax2017Paid + difference;

  return {
    tax2017Paid,
    salesBefore,
    inflationRate,
    rateBefore,
    taxBefore,
    salesWith,
    rateWith,
    taxWith,
    difference,
    tax2018,
  };
}

/** Year-over-year change. Returns null pct when the base is 0 (avoid Infinity). */
export function yoyChange(base: number, current: number) {
  const abs = current - base;
  const pct = base === 0 ? null : abs / base;
  return { abs, pct };
}
