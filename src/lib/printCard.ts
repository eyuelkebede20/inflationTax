import type { HistoryItem } from "./storage";
import { buildShareUrl } from "./share";
import { formatBirr, formatRate, formatDate } from "./format";

// Opens a print-only window with a single taxpayer card and triggers print.
// The card is signed by the user who created it and carries the transaction ID
// plus a QR code (the self-contained share link) so it can be verified later.
// Resolves after the print dialog is dismissed so the caller can lock the row.
export async function printCard(
  item: HistoryItem,
  labels: Record<string, string>
): Promise<void> {
  const rows: [string, string][] = [
    [labels.name, item.name || "—"],
    [labels.tin, item.tin || "—"],
    [labels.business, item.businessType || "—"],
    [labels.kind, item.kind === "rental" ? labels.kind_rental : labels.kind_tax],
    [labels.lastyear_tax, formatBirr(item.lastYearTax)],
    [labels.sales_before, formatBirr(item.base)],
    [labels.tax_before, `${formatBirr(item.taxBefore)} (${formatRate(item.curfewRateBefore)})`],
    [labels.sales_with, formatBirr(item.salesWith)],
    [labels.tax_with, `${formatBirr(item.taxWith)} (${formatRate(item.curfewRateWith)})`],
    [labels.garaagaruma, formatBirr(item.garaagaruma)],
  ];

  const rowsHtml = rows
    .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
    .join("");

  // QR encodes the self-contained share link, generated locally (no third party).
  // qrcode is lazy-loaded so it only ships when a card is actually printed.
  let qr = "";
  try {
    const QRCode = (await import("qrcode")).default;
    qr = await QRCode.toDataURL(buildShareUrl(item), { width: 150, margin: 1 });
  } catch {
    /* QR is best-effort; the card still prints without it */
  }

  const signedBy = item.ownerName || "—";
  const ref = item.id;

  const html = `<!doctype html><html><head><meta charset="utf-8" />
<title>${escapeHtml(item.name || "Taxpayer")} — ${escapeHtml(labels.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #0f172a; margin: 32px; }
  .card { max-width: 640px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  th { color: #475569; font-weight: 600; width: 45%; }
  .total { display: flex; justify-content: space-between; align-items: baseline;
    margin-top: 18px; padding-top: 14px; border-top: 2px solid #0f766e; }
  .total .k { color: #475569; font-size: 13px; }
  .total .v { font-size: 22px; font-weight: 800; color: #0f766e; }
  .sign { display: flex; justify-content: space-between; align-items: flex-end;
    gap: 16px; margin-top: 18px; }
  .sign .meta { font-size: 12px; color: #475569; line-height: 1.6; }
  .sign .meta b { color: #0f172a; }
  .sign .ref { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #64748b; word-break: break-all; }
  .sign .qr { text-align: center; flex-shrink: 0; }
  .sign .qr img { width: 110px; height: 110px; }
  .sign .qr span { display: block; font-size: 10px; color: #94a3b8; margin-top: 2px; }
  .foot { color: #94a3b8; font-size: 11px; margin-top: 16px; text-align: center; }
</style></head>
<body>
  <div class="card">
    <h1>${escapeHtml(labels.title)}</h1>
    <div class="sub">${escapeHtml(labels.subtitle)} · ${escapeHtml(formatDate(item.createdAt))}</div>
    <table><tbody>${rowsHtml}</tbody></table>
    <div class="total">
      <span class="k">${escapeHtml(labels.taaksii2018)}</span>
      <span class="v">${escapeHtml(formatBirr(item.taaksiiBara2018))}</span>
    </div>
    <div class="sign">
      <div class="meta">
        <div>${escapeHtml(labels.signed_by)}: <b>${escapeHtml(signedBy)}</b></div>
        <div class="ref">${escapeHtml(labels.ref)}: ${escapeHtml(ref)}</div>
      </div>
      ${qr ? `<div class="qr"><img src="${qr}" alt="QR" /><span>${escapeHtml(labels.scan)}</span></div>` : ""}
    </div>
    <div class="foot">InflaTax</div>
  </div>
</body></html>`;

  return new Promise((resolve) => {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) {
      resolve();
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
      resolve();
    }, 300);
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
