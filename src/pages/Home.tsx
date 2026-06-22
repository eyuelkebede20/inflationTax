import { useEffect, useState } from "react";
import DataInput, { type EntryMeta } from "../components/DataInput";
import HistoryList from "../components/HistoryList";
import { useAuth } from "../hooks/AuthContext";
import { useSettings } from "../hooks/useSettings";
import {
  deleteCalculation,
  getHistory,
  saveCalculation,
  type HistoryItem,
} from "../lib/storage";
import type { CalcResult } from "../lib/calc";
import { formatBirr, formatBirrDelta, formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { settings, loading: settingsLoading } = useSettings();
  const { t } = useT();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<CalcResult | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoadingHistory(true);
    getHistory(userId)
      .then((items) => active && setHistory(items))
      .catch(() => active && setError(t("common.err_load")))
      .finally(() => active && setLoadingHistory(false));
    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  async function handleCalculated(result: CalcResult, meta: EntryMeta) {
    setError(null);
    setLast(result);
    setSaving(true);
    try {
      const saved = await saveCalculation(userId, result, meta);
      setHistory((prev) => [saved, ...prev]);
    } catch {
      setError(t("common.err_save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = history;
    setHistory((h) => h.filter((it) => it.id !== id));
    try {
      await deleteCalculation(userId, id);
    } catch {
      setHistory(prev); // revert on failure
      setError(t("common.err_save"));
    }
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>{t("home.title")}</h1>
        <p>{t("home.subtitle")}</p>
      </div>

      <div className="callout">
        <span className="ico">💡</span>
        <div className="body">
          <strong>{t("home.why_title")}</strong>
          <br />
          {t("home.why_body")}
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <DataInput
        config={settings}
        onCalculated={handleCalculated}
        saving={saving || settingsLoading}
      />

      {last && (
        <div className="card">
          <h2>{t("home.latest")}</h2>
          <div className="result-cards">
            <div className="result-card">
              <div className="k">{t("result.lastyear_tax")}</div>
              <div className="result-big">{formatBirr(last.lastYearTax)}</div>
            </div>
            <div className="result-card">
              <div className="k">{t("result.tax_before")}</div>
              <div className="result-big">{formatBirr(last.taxBefore)}</div>
              <div className="muted small">
                {formatRate(last.curfewRateBefore)}
              </div>
            </div>
            <div className="result-card">
              <div className="k">{t("result.tax_with")}</div>
              <div className="result-big">{formatBirr(last.taxWith)}</div>
              <div className="muted small">
                {formatRate(last.curfewRateWith)}
              </div>
            </div>
            <div className="result-card" style={{ borderColor: "var(--brand)" }}>
              <div className="k">{t("result.taaksii2018")}</div>
              <div className="result-big">{formatBirr(last.taaksiiBara2018)}</div>
              <div className="muted small delta-up">
                {formatBirrDelta(last.garaagaruma)}
              </div>
            </div>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t("home.click_row")}
          </p>
        </div>
      )}

      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>{t("home.history")}</h2>
          <span className="muted small">
            {userId ? t("common.saved_account") : t("common.saved_device")}
          </span>
        </div>
        <HistoryList
          items={history}
          loading={loadingHistory}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
