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
  v2017,
  v2018,
  max,
}: {
  label: string;
  v2017: number;
  v2018: number;
  max: number;
}) {
  const h = (v: number) => (max <= 0 ? 0 : Math.max(3, (v / max) * 160));
  return (
    <div className="chart-group">
      <div className="bars">
        <div className="bar y2016" style={{ height: h(v2017) }}>
          <span className="val">{formatBirr(v2017)}</span>
        </div>
        <div className="bar y2017" style={{ height: h(v2018) }}>
          <span className="val">{formatBirr(v2018)}</span>
        </div>
      </div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export default function AnalysisBoard({ item }: { item: HistoryItem }) {
  const chartMax = Math.max(
    item.taxBefore,
    item.taxWith,
    item.tax2017Paid,
    item.tax2018,
    1
  );

  return (
    <div className="stack">
      {/* Before vs after inflation */}
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

          {/* Sales */}
          <div className="rowlabel">Sales</div>
          <div className="num">{formatBirr(item.salesBefore)}</div>
          <div className="num">{formatBirr(item.salesWith)}</div>
          <DeltaCells base={item.salesBefore} current={item.salesWith} />

          {/* Bracket rate */}
          <div className="rowlabel">Tax bracket rate</div>
          <div className="num">{formatRate(item.rateBefore)}</div>
          <div className="num">{formatRate(item.rateWith)}</div>
          <div className="num muted">—</div>
          <div className="num muted col-delta">—</div>

          {/* Tax on sales */}
          <div className="rowlabel">Tax on sales</div>
          <div className="num">{formatBirr(item.taxBefore)}</div>
          <div className="num">{formatBirr(item.taxWith)}</div>
          <DeltaCells base={item.taxBefore} current={item.taxWith} />
        </div>

        {item.rateWith > item.rateBefore && (
          <div className="alert info" style={{ marginTop: 14, marginBottom: 0 }}>
            Inflation pushed sales from the {formatRate(item.rateBefore)} bracket
            up into the {formatRate(item.rateWith)} bracket.
          </div>
        )}
      </div>

      {/* 2018 tax build-up */}
      <div className="card">
        <h2>2018 tax (Taaksii Bara 2018)</h2>
        <div className="result-cards">
          <div className="result-card">
            <div className="k">2017 tax paid</div>
            <div className="result-big">{formatBirr(item.tax2017Paid)}</div>
          </div>
          <div className="result-card">
            <div className="k">+ Inflation difference (Garaagaruma)</div>
            <div className="result-big delta-up">
              {formatBirrDelta(item.difference)}
            </div>
          </div>
          <div className="result-card" style={{ borderColor: "var(--brand)" }}>
            <div className="k">= 2018 total tax</div>
            <div className="result-big">{formatBirr(item.tax2018)}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2>Comparison</h2>
        <div className="chart">
          <Bars
            label="Tax on sales"
            v2017={item.taxBefore}
            v2018={item.taxWith}
            max={chartMax}
          />
          <Bars
            label="Total tax"
            v2017={item.tax2017Paid}
            v2018={item.tax2018}
            max={chartMax}
          />
        </div>
        <div className="legend">
          <span>
            <span className="swatch" style={{ background: "#0ea5e9" }} />
            2017 (before)
          </span>
          <span>
            <span className="swatch" style={{ background: "#0f766e" }} />
            2018 (with inflation)
          </span>
        </div>
      </div>
    </div>
  );
}
