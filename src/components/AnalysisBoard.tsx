import type { HistoryItem } from "../lib/storage";
import { yoyChange } from "../lib/calc";
import {
  formatBirr,
  formatBirrDelta,
  formatPct,
  formatRate,
} from "../lib/format";

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
  const chartMax = Math.max(
    item.profitTaxBase,
    item.profitTaxInfl,
    item.curfewBase,
    item.curfewInfl,
    item.totalBase,
    item.totalInfl,
    1
  );

  return (
    <div className="stack">
      {/* Before vs with inflation */}
      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>{item.businessType || "Entry"}</h2>
          <span className="pill">
            Inflation {formatRate(item.inflationRate)}
          </span>
        </div>

        <div className="compare-grid">
          <div className="head">Metric</div>
          <div className="head num">Before inflation</div>
          <div className="head num">With inflation</div>
          <div className="head num">Δ (abs)</div>
          <div className="head num col-delta">Δ (%)</div>

          {/* Taxable amount */}
          <div className="rowlabel">Taxable amount</div>
          <div className="num">{formatBirr(item.taxable)}</div>
          <div className="num">{formatBirr(item.inflatedAmount)}</div>
          <DeltaCells base={item.taxable} current={item.inflatedAmount} />

          {/* Profit tax */}
          <div className="rowlabel">Profit tax</div>
          <div className="num">{formatBirr(item.profitTaxBase)}</div>
          <div className="num">{formatBirr(item.profitTaxInfl)}</div>
          <DeltaCells base={item.profitTaxBase} current={item.profitTaxInfl} />

          {/* Curfew rate */}
          <div className="rowlabel">Curfew rate</div>
          <div className="num">{formatRate(item.curfewRateBase)}</div>
          <div className="num">{formatRate(item.curfewRateInfl)}</div>
          <div className="num muted">—</div>
          <div className="num muted col-delta">—</div>

          {/* Curfew tax */}
          <div className="rowlabel">Curfew tax</div>
          <div className="num">{formatBirr(item.curfewBase)}</div>
          <div className="num">{formatBirr(item.curfewInfl)}</div>
          <DeltaCells base={item.curfewBase} current={item.curfewInfl} />

          {/* Total */}
          <div className="rowlabel" style={{ fontWeight: 700 }}>
            Total tax
          </div>
          <div className="num" style={{ fontWeight: 700 }}>
            {formatBirr(item.totalBase)}
          </div>
          <div className="num" style={{ fontWeight: 700 }}>
            {formatBirr(item.totalInfl)}
          </div>
          <DeltaCells base={item.totalBase} current={item.totalInfl} />
        </div>

        {item.curfewRateInfl > item.curfewRateBase && (
          <div className="alert info" style={{ marginTop: 14, marginBottom: 0 }}>
            Inflation pushed the curfew bracket from{" "}
            {formatRate(item.curfewRateBase)} up to{" "}
            {formatRate(item.curfewRateInfl)}.
          </div>
        )}
      </div>

      {/* Extra paid this year */}
      <div className="card">
        <h2>Extra tax paid this year (due to inflation)</h2>
        <div className="result-cards">
          <div className="result-card">
            <div className="k">Extra profit tax</div>
            <div className="result-big delta-up">
              {formatBirrDelta(item.profitTaxDiff)}
            </div>
          </div>
          <div className="result-card">
            <div className="k">Extra curfew tax</div>
            <div className="result-big delta-up">
              {formatBirrDelta(item.curfewDiff)}
            </div>
          </div>
          <div className="result-card" style={{ borderColor: "var(--brand)" }}>
            <div className="k">Total extra this year</div>
            <div className="result-big delta-up">
              {formatBirrDelta(item.totalDiff)}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2>Before vs with inflation</h2>
        <div className="chart">
          <Bars
            label="Profit tax"
            vBase={item.profitTaxBase}
            vInfl={item.profitTaxInfl}
            max={chartMax}
          />
          <Bars
            label="Curfew tax"
            vBase={item.curfewBase}
            vInfl={item.curfewInfl}
            max={chartMax}
          />
          <Bars
            label="Total"
            vBase={item.totalBase}
            vInfl={item.totalInfl}
            max={chartMax}
          />
        </div>
        <div className="legend">
          <span>
            <span className="swatch" style={{ background: "#0ea5e9" }} />
            Before inflation
          </span>
          <span>
            <span className="swatch" style={{ background: "#0f766e" }} />
            With inflation
          </span>
        </div>
      </div>
    </div>
  );
}
