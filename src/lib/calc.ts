// ---------------------------------------------------------------------------
// Calculation engine. Pure functions only. No rounding inside the math —
// round only for display (see lib/format.ts).
// ---------------------------------------------------------------------------

export interface CalcResult {
  taxable2017: number;
  inflationRate: number;
  taxable2016: number;
  profitTax2016: number;
  profitTax2017: number;
  rate2016: number;
  rate2017: number;
  curfew2016: number;
  curfew2017: number;
}

/**
 * Profit tax (Schedule-C bracket formula). Applies to both years, each using
 * its own taxable amount. Translated directly from the spreadsheet IF formula.
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
 * Schedule rate ("curfew" table). The bracket is chosen by each year's own
 * taxable amount. Assumption B: amounts >= 2,000,000 default to the top 9%.
 */
export function scheduleRate(amount: number): number {
  if (amount <= 100000) return 0.02;
  if (amount <= 500000) return 0.03;
  if (amount <= 1000000) return 0.05;
  if (amount <= 1500000) return 0.07;
  return 0.09; // 1,500,001 and above
}

/**
 * Full computation. Assumption A: 2017 is deflated to 2016 by dividing by
 * (1 + inflation).
 */
export function computeResult(
  taxable2017: number,
  inflationRate: number
): CalcResult {
  const taxable2016 = taxable2017 / (1 + inflationRate);

  const profitTax2016 = profitTax(taxable2016);
  const profitTax2017 = profitTax(taxable2017);

  const rate2016 = scheduleRate(taxable2016);
  const rate2017 = scheduleRate(taxable2017);

  const curfew2016 = taxable2016 * rate2016;
  const curfew2017 = taxable2017 * rate2017;

  return {
    taxable2017,
    inflationRate,
    taxable2016,
    profitTax2016,
    profitTax2017,
    rate2016,
    rate2017,
    curfew2016,
    curfew2017,
  };
}

/** Year-over-year change. Returns null pct when the base is 0 (avoid Infinity). */
export function yoyChange(base: number, current: number) {
  const abs = current - base;
  const pct = base === 0 ? null : abs / base;
  return { abs, pct };
}
