import type { HistoryItem } from "../lib/storage";
import { formatBirr, formatBirrDelta, formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

function Bars({
  label,
  vBase,
  vInfl,
  max,
}: {
  label: string;
  vBase: number;
  vInfl: number;
  max: number;
}) {
  const h = (v: number) => (max <= 0 ? 0 : Math.max(3, (v / max) * 160));
  return (
    <div className="chart-group">
      <div className="bars">
        <div className="bar before" style={{ height: h(vBase) }}>
          <span className="val">{formatBirr(vBase)}</span>
        </div>
        <div className="bar with" style={{ height: h(vInfl) }}>
          <span className="val">{formatBirr(vInfl)}</span>
        </div>
      </div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export default function AnalysisBoard({ item }: { item: HistoryItem }) {
  const { t } = useT();
  const chartMax = Math.max(
    item.taxBefore,
    item.taxWith,
    item.lastYearTax,
    item.taaksiiBara2018,
    1
  );
  const kindLabel = item.kind === "rental" ? t("form.kind_rental") : t("form.kind_tax");

  return (
    <div className="stack">
      {/* Header */}
      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>
            {item.name || t("analysis.entry")}
            {item.businessType ? ` · ${item.businessType}` : ""}
          </h2>
          <span className="pill">
            {kindLabel} · {t("common.inflation_in_use")} {formatRate(item.inflationRate)}
          </span>
        </div>
        {item.ownerName && (
          <p className="muted small" style={{ marginTop: 6, marginBottom: 0 }}>
            {t("card.signed_by")}: <strong>{item.ownerName}</strong> ·{" "}
            <span style={{ fontFamily: "monospace" }}>
              {t("card.ref")}: {item.id}
            </span>
          </p>
        )}

        <div className="result-cards">
          <div className="result-card">
            <div className="k">{t("analysis.turnover")}</div>
            <div className="result-big">{formatBirr(item.turnover)}</div>
            {item.kind === "rental" && (
              <div className="muted small">
                {t("analysis.rental_base", {
                  pct: formatRate(item.rentalShare),
                  base: formatBirr(item.base),
                })}
              </div>
            )}
          </div>
          <div className="result-card">
            <div className="k">{t("result.lastyear_tax")}</div>
            <div className="result-big">{formatBirr(item.lastYearTax)}</div>
          </div>
          <div className="result-card">
            <div className="k">{t("analysis.curfew_tax")}</div>
            <div className="result-big">{formatBirr(item.taxBefore)}</div>
            <div className="muted small">{formatRate(item.curfewRateBefore)}</div>
          </div>
          <div className="result-card" style={{ borderColor: "var(--brand)" }}>
            <div className="k">{t("result.taaksii2018")}</div>
            <div className="result-big">{formatBirr(item.taaksiiBara2018)}</div>
            <div className="muted small delta-up">{formatBirrDelta(item.garaagaruma)}</div>
          </div>
        </div>
      </div>

      {/* Result build-up */}
      <div className="card">
        <h2>{t("analysis.result_title")}</h2>
        <div className="result-cards">
          <div className="result-card">
            <div className="k">{t("result.lastyear_tax")}</div>
            <div className="result-big">{formatBirr(item.lastYearTax)}</div>
          </div>
          <div className="result-card">
            <div className="k">{t("analysis.plus_diff")}</div>
            <div className="result-big delta-up">{formatBirrDelta(item.garaagaruma)}</div>
          </div>
          <div className="result-card" style={{ borderColor: "var(--brand)" }}>
            <div className="k">{t("result.taaksii2018")}</div>
            <div className="result-big">{formatBirr(item.taaksiiBara2018)}</div>
          </div>
        </div>

        <div className="chart">
          <Bars
            label={t("analysis.curfew_tax")}
            vBase={item.taxBefore}
            vInfl={item.taxWith}
            max={chartMax}
          />
          <Bars
            label={t("result.taaksii2018")}
            vBase={item.lastYearTax}
            vInfl={item.taaksiiBara2018}
            max={chartMax}
          />
        </div>
        <div className="legend">
          <span>
            <span className="swatch" style={{ background: "#0ea5e9" }} />
            {t("analysis.before")}
          </span>
          <span>
            <span className="swatch" style={{ background: "#0f766e" }} />
            {t("analysis.with")}
          </span>
        </div>
      </div>
    </div>
  );
}
