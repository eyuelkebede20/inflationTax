// Display formatting helpers. Never show Infinity / NaN.

const birrFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Money: Birr with thousands separators and 2 decimals. */
export function formatBirr(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${birrFormatter.format(value)} Birr`;
}

/** Rate as a percentage, e.g. 0.05 -> "5%". */
export function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return "—";
  const pct = rate * 100;
  // Drop trailing zeros: 5% not 5.00%, but 2.5% kept.
  const text = Number.isInteger(pct) ? pct.toString() : pct.toFixed(2);
  return `${text}%`;
}

/** Percentage change. null base -> "—". */
export function formatPct(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(2)}%`;
}

/** Signed absolute Birr change for YoY rows. */
export function formatBirrDelta(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${birrFormatter.format(value)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
