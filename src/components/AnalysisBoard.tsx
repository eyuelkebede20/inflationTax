import type { HistoryItem } from "../lib/storage";
import { yoyChange } from "../lib/calc";
import {
  formatBirr,
  formatBirrDelta,
  formatPct,
  formatRate,
} from "../lib/format";
import { useT } from "../lib/i18n";

function DeltaCells({ base, current }: { base: number; current: number }) {
  const { abs, pct } = yoyChange(base, current);
  const cls = abs > 0 ? "delta-up" : abs < 0 ? "delta-down" : "muted";
  return (
    <>
      <div className={`num ${cls}`}>{formatBirrDelta(abs)}</div>
      <div className={`num col-delta ${cls}`}>{formatPct(pct)}</div>
    </>
  );
}

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
        <div className="bar y2016" style={{ height: h(vBase) }}>
          <span className="val">{formatBirr(vBase)}</span>
        </div>
        <div className="bar y2017" style={{ height: h(vInfl) }}>
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
            {t("common.inflation_in_use")} {formatRate(item.inflationRate)}
          </span>
        </div>

        {/* Last year's tax build-up */}
        <div className="result-cards">
          <div className="result-card">
            <div className="k">{t("analysis.turnover")}</div>
            <div className="result-big">{formatBirr(item.turnover)}</div>
          </div>
          <div className="result-card">
            <div className="k">{t("analysis.tot")}</div>
            <div className="result-big">{formatBirr(item.tot)}</div>
            <div className="muted small">{formatRate(item.totRate)}</div>
          </div>
          <div className="result-card">
            <div className="k">{t("analysis.profit_tax")}</div>
            <div className="result-big">{formatBirr(item.profitTaxAmt)}</div>
            <div className="muted small">
              {formatRate(item.profitMargin)} → {formatBirr(item.profitBase)}
            </div>
          </div>
          <div className="result-card" style={{ borderColor: "var(--brand)" }}>
            <div className="k">{t("analysis.buildup")}</div>
            <div className="result-big">{formatBirr(item.lastYearTax)}</div>
            <div className="muted small">
              {item.lastYearTaxManual
                ? t("result.entered")
                : t("result.derived")}
            </div>
          </div>
        </div>
      </div>

      {/* Before vs with inflation (curfew) */}
      <div className="card">
        <h2>{t("analysis.chart")}</h2>
        <div className="compare-grid">
          <div className="head">{t("analysis.metric")}</div>
          <div className="head num">{t("analysis.before")}</div>
          <div className="head num">{t("analysis.with")}</div>
          <div className="head num">{t("analysis.delta_abs")}</div>
          <div className="head num col-delta">{t("analysis.delta_pct")}</div>

          <div className="rowlabel">{t("analysis.turnover")}</div>
          <div className="num">{formatBirr(item.turnover)}</div>
          <div className="num">{formatBirr(item.salesWith)}</div>
          <DeltaCells base={item.turnover} current={item.salesWith} />

          <div className="rowlabel">{t("analysis.curfew_rate")}</div>
          <div className="num">{formatRate(item.curfewRateBefore)}</div>
          <div className="num">{formatRate(item.curfewRateWith)}</div>
          <div className="num muted">—</div>
          <div className="num muted col-delta">—</div>

          <div className="rowlabel" style={{ fontWeight: 700 }}>
            {t("analysis.curfew_tax")}
          </div>
          <div className="num" style={{ fontWeight: 700 }}>
            {formatBirr(item.taxBefore)}
          </div>
          <div className="num" style={{ fontWeight: 700 }}>
            {formatBirr(item.taxWith)}
          </div>
          <DeltaCells base={item.taxBefore} current={item.taxWith} />
        </div>

        {item.curfewRateWith > item.curfewRateBefore && (
          <div className="alert info" style={{ marginTop: 14, marginBottom: 0 }}>
            {t("analysis.bracket_jump", {
              a: formatRate(item.curfewRateBefore),
              b: formatRate(item.curfewRateWith),
            })}
          </div>
        )}
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
            <div className="result-big delta-up">
              {formatBirrDelta(item.garaagaruma)}
            </div>
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
