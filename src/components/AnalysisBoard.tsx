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
  v2016,
  v2017,
  max,
}: {
  label: string;
  v2016: number;
  v2017: number;
  max: number;
}) {
  const h = (v: number) => (max <= 0 ? 0 : Math.max(3, (v / max) * 160));
  return (
    <div className="chart-group">
      <div className="bars">
        <div className="bar y2016" style={{ height: h(v2016) }}>
          <span className="val">{formatBirr(v2016)}</span>
        </div>
        <div className="bar y2017" style={{ height: h(v2017) }}>
          <span className="val">{formatBirr(v2017)}</span>
        </div>
      </div>
      <div className="muted small">{label}</div>
    </div>
  );
}

export default function AnalysisBoard({ item }: { item: HistoryItem }) {
  const chartMax = Math.max(
    item.profitTax2016,
    item.profitTax2017,
    item.curfew2016,
    item.curfew2017,
    1
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>{item.label || "Calculation"}</h2>
          <span className="pill">Inflation {formatRate(item.inflationRate)}</span>
        </div>

        <div className="compare-grid">
          <div className="head">Metric</div>
          <div className="head num">2016 EC</div>
          <div className="head num">2017 EC</div>
          <div className="head num">Δ (abs)</div>
          <div className="head num col-delta">Δ (%)</div>

          {/* Taxable amount */}
          <div className="rowlabel">Taxable amount</div>
          <div className="num">{formatBirr(item.taxable2016)}</div>
          <div className="num">{formatBirr(item.taxable2017)}</div>
          <DeltaCells base={item.taxable2016} current={item.taxable2017} />

          {/* Profit tax */}
          <div className="rowlabel">Profit tax</div>
          <div className="num">{formatBirr(item.profitTax2016)}</div>
          <div className="num">{formatBirr(item.profitTax2017)}</div>
          <DeltaCells base={item.profitTax2016} current={item.profitTax2017} />

          {/* Schedule rate */}
          <div className="rowlabel">Schedule rate</div>
          <div className="num">{formatRate(item.rate2016)}</div>
          <div className="num">{formatRate(item.rate2017)}</div>
          <div className="num muted">—</div>
          <div className="num muted col-delta">—</div>

          {/* Curfew result */}
          <div className="rowlabel">Curfew (taxable × rate)</div>
          <div className="num">{formatBirr(item.curfew2016)}</div>
          <div className="num">{formatBirr(item.curfew2017)}</div>
          <DeltaCells base={item.curfew2016} current={item.curfew2017} />
        </div>
      </div>

      <div className="card">
        <h2>2016 vs 2017</h2>
        <div className="chart">
          <Bars
            label="Profit tax"
            v2016={item.profitTax2016}
            v2017={item.profitTax2017}
            max={chartMax}
          />
          <Bars
            label="Curfew"
            v2016={item.curfew2016}
            v2017={item.curfew2017}
            max={chartMax}
          />
        </div>
        <div className="legend">
          <span>
            <span className="swatch" style={{ background: "#0ea5e9" }} />
            2016 EC
          </span>
          <span>
            <span className="swatch" style={{ background: "#0f766e" }} />
            2017 EC
          </span>
        </div>
      </div>
    </div>
  );
}
