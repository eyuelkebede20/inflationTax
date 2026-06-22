// ---------------------------------------------------------------------------
// Calculation engine. Pure functions only. No rounding inside the math —
// round only for display (see lib/format.ts).
//
// Model (Taaksii Kafalaa Gibiraa Sadarkaa "B"):
//   Last year's tax  = TOT + profit tax, where
//       TOT          = turnover * totRate          (services 10%, adjustable)
//       taxable profit = turnover * profitMargin   (default 10%, adjustable)
//       profit tax   = profitTax(taxable profit)   (Schedule-C IF formula)
//   Curfew flow (proclamation schedule rate, 2-9%):
//       taxBefore    = turnover * curfew(turnover)
//       salesWith    = turnover * (1 + inflationRate)
//       taxWith      = salesWith * curfew(salesWith)
//       garaagaruma  = taxWith - taxBefore
//   Taaksii Bara 2018 = lastYearTax + garaagaruma
// ---------------------------------------------------------------------------

export interface CalcConfig {
  inflationRate: number;
  totRate: number;
  profitMargin: number;
}

export interface CalcResult {
  // inputs / config
  turnover: number; // taxable income / gross (e.g. 450,000)
  inflationRate: number;
  totRate: number;
  profitMargin: number;
  isService: boolean; // TOT only applies to service businesses

  // last year's tax build-up
  profitBase: number; // turnover * profitMargin
  profitTaxAmt: number; // profitTax(profitBase)
  tot: number; // turnover * totRate
  lastYearTax: number; // tot + profitTaxAmt (or a manual override)
  lastYearTaxManual: boolean; // true when the tax was entered, not derived

  // curfew flow
  curfewRateBefore: number;
  taxBefore: number;
  salesWith: number;
  curfewRateWith: number;
  taxWith: number;
  garaagaruma: number;

  // result
  taaksiiBara2018: number;
}

/**
 * Profit tax (Schedule-C bracket formula), translated directly from the
 * spreadsheet IF formula. g is the taxable income.
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

/**
 * Last year's tax derived from turnover: TOT + profit tax. TOT only applies to
 * service businesses; for non-services it is dropped (0).
 */
export function lastYearTaxFromTurnover(
  turnover: number,
  cfg: CalcConfig,
  isService: boolean
): number {
  const tot = isService ? turnover * cfg.totRate : 0;
  const profitTaxAmt = profitTax(turnover * cfg.profitMargin);
  return tot + profitTaxAmt;
}

/**
 * Inverse: given last year's tax, back-solve the turnover (Route 2). The
 * forward function is monotonically increasing, so bisection is exact enough.
 */
export function turnoverFromTax(
  tax: number,
  cfg: CalcConfig,
  isService: boolean
): number {
  if (tax <= 0) return 0;
  let lo = 0;
  let hi = 1;
  // grow upper bound until it exceeds the target
  while (lastYearTaxFromTurnover(hi, cfg, isService) < tax && hi < 1e12) hi *= 2;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (lastYearTaxFromTurnover(mid, cfg, isService) < tax) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Compute a full result. Provide a turnover and/or a known last-year tax:
 *  - turnover only          -> last-year tax is derived (TOT + profit tax)
 *  - tax only               -> turnover is back-solved from the tax (Route 2)
 *  - both                   -> turnover drives the curfew; the typed tax wins
 */
export function computeResult(
  cfg: CalcConfig,
  input: { turnover?: number; lastYearTax?: number; isService?: boolean }
): CalcResult {
  const isService = input.isService ?? true;
  const hasTurnover =
    input.turnover != null && Number.isFinite(input.turnover);
  const hasTax = input.lastYearTax != null && Number.isFinite(input.lastYearTax);

  let turnover: number;
  let lastYearTax: number;
  let lastYearTaxManual: boolean;

  if (hasTurnover) {
    turnover = input.turnover!;
    if (hasTax) {
      lastYearTax = input.lastYearTax!;
      lastYearTaxManual = true;
    } else {
      lastYearTax = lastYearTaxFromTurnover(turnover, cfg, isService);
      lastYearTaxManual = false;
    }
  } else if (hasTax) {
    turnover = turnoverFromTax(input.lastYearTax!, cfg, isService);
    lastYearTax = input.lastYearTax!;
    lastYearTaxManual = true;
  } else {
    turnover = 0;
    lastYearTax = 0;
    lastYearTaxManual = false;
  }

  const profitBase = turnover * cfg.profitMargin;
  const profitTaxAmt = profitTax(profitBase);
  const tot = isService ? turnover * cfg.totRate : 0;

  const curfewRateBefore = scheduleRate(turnover);
  const taxBefore = turnover * curfewRateBefore;

  const salesWith = turnover * (1 + cfg.inflationRate);
  const curfewRateWith = scheduleRate(salesWith);
  const taxWith = salesWith * curfewRateWith;

  const garaagaruma = taxWith - taxBefore;
  const taaksiiBara2018 = lastYearTax + garaagaruma;

  return {
    turnover,
    inflationRate: cfg.inflationRate,
    totRate: cfg.totRate,
    profitMargin: cfg.profitMargin,
    isService,
    profitBase,
    profitTaxAmt,
    tot,
    lastYearTax,
    lastYearTaxManual,
    curfewRateBefore,
    taxBefore,
    salesWith,
    curfewRateWith,
    taxWith,
    garaagaruma,
    taaksiiBara2018,
  };
}

/** Year-over-year change. Returns null pct when the base is 0 (avoid Infinity). */
export function yoyChange(base: number, current: number) {
  const abs = current - base;
  const pct = base === 0 ? null : abs / base;
  return { abs, pct };
}
