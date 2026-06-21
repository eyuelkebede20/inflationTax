// ---------------------------------------------------------------------------
// Calculation engine. Pure functions only. No rounding inside the math —
// round only for display (see lib/format.ts).
//
// Idea: a taxpayer with a taxable amount pays TWO taxes:
//   1) Profit tax  — Schedule-C IF-formula bracket tax.
//   2) Curfew tax  — proclamation schedule rate (2-9%) x amount.
// Inflation inflates the nominal amount (x (1 + rate)), pushing it into higher
// brackets, so the same real income costs MORE tax this year (bracket creep).
// We compute both taxes for the base amount and the inflated amount, and the
// extra paid this year.
// ---------------------------------------------------------------------------

export interface CalcResult {
  taxable: number; // base taxable amount (before inflation)
  inflationRate: number;
  inflatedAmount: number; // taxable * (1 + inflationRate)

  // Before inflation
  profitTaxBase: number;
  curfewRateBase: number;
  curfewBase: number;
  totalBase: number;

  // With inflation (this year)
  profitTaxInfl: number;
  curfewRateInfl: number;
  curfewInfl: number;
  totalInfl: number;

  // Inflation-driven increases (extra paid this year)
  profitTaxDiff: number;
  curfewDiff: number;
  totalDiff: number;
}

/**
 * Profit tax (Schedule-C bracket formula), translated directly from the
 * spreadsheet IF formula.
 */
export function profitTax(g: number): number {
  if (g <= 7200) return 0;
  if (g <= 19800) return g * 0.1 - 720;
  if (g <= 38400) return g * 0.15 - 1710;
  if (g <= 63000) return g * 0.2 - 3630;
  if (g <= 93600) return g * 0.25 - 6780;
  if (g <= 130800) return g * 0.3 - 11460;
  return g * 0.35 - 18000; // g > 130,800
}

/**
 * Curfew / proclamation schedule rate, chosen by the amount. Assumption:
 * amounts >= 2,000,000 default to the top 9% (table doesn't define higher).
 */
export function scheduleRate(amount: number): number {
  if (amount <= 100000) return 0.02;
  if (amount <= 500000) return 0.03;
  if (amount <= 1000000) return 0.05;
  if (amount <= 1500000) return 0.07;
  return 0.09; // 1,500,001 and above
}

export function computeResult(
  taxable: number,
  inflationRate: number
): CalcResult {
  const inflatedAmount = taxable * (1 + inflationRate);

  // Before inflation
  const profitTaxBase = profitTax(taxable);
  const curfewRateBase = scheduleRate(taxable);
  const curfewBase = taxable * curfewRateBase;
  const totalBase = profitTaxBase + curfewBase;

  // With inflation
  const profitTaxInfl = profitTax(inflatedAmount);
  const curfewRateInfl = scheduleRate(inflatedAmount);
  const curfewInfl = inflatedAmount * curfewRateInfl;
  const totalInfl = profitTaxInfl + curfewInfl;

  return {
    taxable,
    inflationRate,
    inflatedAmount,
    profitTaxBase,
    curfewRateBase,
    curfewBase,
    totalBase,
    profitTaxInfl,
    curfewRateInfl,
    curfewInfl,
    totalInfl,
    profitTaxDiff: profitTaxInfl - profitTaxBase,
    curfewDiff: curfewInfl - curfewBase,
    totalDiff: totalInfl - totalBase,
  };
}

/** Year-over-year change. Returns null pct when the base is 0 (avoid Infinity). */
export function yoyChange(base: number, current: number) {
  const abs = current - base;
  const pct = base === 0 ? null : abs / base;
  return { abs, pct };
}
