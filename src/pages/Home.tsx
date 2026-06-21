import { useEffect, useState } from "react";
import DataInput from "../components/DataInput";
import HistoryList from "../components/HistoryList";
import { useAuth } from "../hooks/AuthContext";
import { useSettings } from "../hooks/useSettings";
import {
  getHistory,
  saveCalculation,
  type HistoryItem,
} from "../lib/storage";
import type { CalcResult } from "../lib/calc";
import { formatBirr, formatBirrDelta, formatRate } from "../lib/format";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { inflationRate, loading: settingsLoading } = useSettings();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoadingHistory(true);
    getHistory(userId)
      .then((items) => active && setHistory(items))
      .catch((e) => active && setError(e.message ?? "Failed to load history."))
      .finally(() => active && setLoadingHistory(false));
    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  async function handleCalculated(result: CalcResult, businessType: string | null) {
    setError(null);
    setLastResult(result);
    setSaving(true);
    try {
      const saved = await saveCalculation(userId, result, businessType);
      setHistory((prev) => [saved, ...prev]);
    } catch (e) {
      setError((e as Error).message ?? "Failed to save calculation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>How much more tax inflation costs you.</h1>
        <p>
          Enter a taxable amount. InflaTax computes the profit tax and curfew tax
          on it, inflates it by the current rate, and shows the extra tax you owe
          this year from bracket creep.
        </p>
      </div>

      {error && <div className="alert error">{error}</div>}

      <DataInput
        inflationRate={inflationRate}
        onCalculated={handleCalculated}
        saving={saving || settingsLoading}
      />

      {lastResult && (
        <div className="card">
          <h2>Latest result</h2>
          <div className="result-cards">
            <div className="result-card">
              <div className="k">Profit tax (before)</div>
              <div className="result-big">
                {formatBirr(lastResult.profitTaxBase)}
              </div>
            </div>
            <div className="result-card">
              <div className="k">Curfew tax (before)</div>
              <div className="result-big">
                {formatBirr(lastResult.curfewBase)}
              </div>
              <div className="muted small">
                {formatRate(lastResult.curfewRateBase)} rate
              </div>
            </div>
            <div className="result-card">
              <div className="k">Total with inflation</div>
              <div className="result-big">
                {formatBirr(lastResult.totalInfl)}
              </div>
            </div>
            <div className="result-card" style={{ borderColor: "var(--brand)" }}>
              <div className="k">Extra paid this year</div>
              <div className="result-big delta-up">
                {formatBirrDelta(lastResult.totalDiff)}
              </div>
            </div>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Click the row in History below for the full before/after breakdown.
          </p>
        </div>
      )}

      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>History</h2>
          <span className="muted small">
            {userId ? "Saved to your account" : "Saved on this device"}
          </span>
        </div>
        <HistoryList items={history} loading={loadingHistory} />
      </div>
    </div>
  );
}
