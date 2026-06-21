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
import { formatBirr } from "../lib/format";

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

  async function handleCalculated(result: CalcResult, label: string | null) {
    setError(null);
    setLastResult(result);
    setSaving(true);
    try {
      const saved = await saveCalculation(userId, result, label);
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
        <h1>Inflation-adjusted tax, two years at a glance.</h1>
        <p>
          Type your 2017 EC taxable amount. InflaTax derives the prior year
          (2016 EC) from inflation and computes profit tax and the schedule
          (curfew) rate for both years.
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
              <div className="k">2017 profit tax</div>
              <div className="result-big">
                {formatBirr(lastResult.profitTax2017)}
              </div>
            </div>
            <div className="result-card">
              <div className="k">2017 curfew</div>
              <div className="result-big">
                {formatBirr(lastResult.curfew2017)}
              </div>
            </div>
            <div className="result-card">
              <div className="k">2016 profit tax</div>
              <div className="result-big">
                {formatBirr(lastResult.profitTax2016)}
              </div>
            </div>
            <div className="result-card">
              <div className="k">2016 curfew</div>
              <div className="result-big">
                {formatBirr(lastResult.curfew2016)}
              </div>
            </div>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            Click the row in History below for the full 2016 vs 2017 breakdown.
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
