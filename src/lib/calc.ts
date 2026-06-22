// ---------------------------------------------------------------------------
// Calculation engine. Pure functions only. No rounding inside the math —
// round only for display (see lib/format.ts).
//
// Model — Taaksii Kafalaa Gibiraa Sadarkaa "B" 2018 (matches the spreadsheet):
//   Inputs (both required):
//     turnover      (F) = sales before inflation, as entered
//     lastYearTax   (E) = tax paid on 2017
//   A "rental" entry only feeds `rentalShare` (50%) of turnover to the curfew
//   algorithm; a "tax" entry feeds the full turnover.
//     base          = kind === "rental" ? turnover * rentalShare : turnover
//     taxBefore     (G) = base * scheduleRate(base)
//     salesWith     (H) = base * (1 + inflationRate)
//     taxWith       (I) = salesWith * scheduleRate(salesWith)
//     garaagaruma   (J) = taxWith - taxBefore           (I - G)
//     taaksiiBara2018 (K) = lastYearTax + garaagaruma   (E + J)
// ---------------------------------------------------------------------------

export type EntryKind = "tax" | "rental";

export interface CalcConfig {
  inflationRate: number; // e.g. 0.152
  rentalShare: number; // fraction of income fed to the algorithm for rentals
}

export interface CalcResult {
  // inputs / config
  turnover: number; // sales before inflation, as entered (col F source)
  lastYearTax: number; // tax paid on 2017 (col E)
  kind: EntryKind;
  inflationRate: number;
  rentalShare: number;
  base: number; // effective amount fed to the curfew algorithm

  // curfew flow
  curfewRateBefore: number;
  taxBefore: number; // col G
  salesWith: number; // col H
  curfewRateWith: number;
  taxWith: number; // col I

  // result
  garaagaruma: number; // col J = I - G
  taaksiiBara2018: number; // col K = E + J
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

/** Compute a full result from the turnover, last year's tax, and entry kind. */
export function computeResult(
  cfg: CalcConfig,
  input: { turnover: number; lastYearTax: number; kind: EntryKind }
): CalcResult {
  const { kind } = input;
  const turnover = Number.isFinite(input.turnover) ? input.turnover : 0;
  const lastYearTax = Number.isFinite(input.lastYearTax) ? input.lastYearTax : 0;
  const rentalShare = cfg.rentalShare;

  const base = kind === "rental" ? turnover * rentalShare : turnover;

  const curfewRateBefore = scheduleRate(base);
  const taxBefore = base * curfewRateBefore;

  const salesWith = base * (1 + cfg.inflationRate);
  const curfewRateWith = scheduleRate(salesWith);
  const taxWith = salesWith * curfewRateWith;

  const garaagaruma = taxWith - taxBefore;
  const taaksiiBara2018 = lastYearTax + garaagaruma;

  return {
    turnover,
    lastYearTax,
    kind,
    inflationRate: cfg.inflationRate,
    rentalShare,
    base,
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
