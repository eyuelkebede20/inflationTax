import { useCallback, useEffect, useState } from "react";
import DataInput from "../components/DataInput";
import HistoryList from "../components/HistoryList";
import { useAuth } from "../hooks/AuthContext";
import { useRole } from "../hooks/RoleContext";
import { useSettings } from "../hooks/useSettings";
import {
  deleteCalculation,
  getHistory,
  markPrinted,
  saveCalculation,
  voidCalculation,
  type EntryMeta,
  type HistoryItem,
} from "../lib/storage";
import type { CalcResult } from "../lib/calc";
import { formatBirr, formatBirrDelta, formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

const PAGE_SIZE = 20;

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { role, branchId } = useRole();
  const { settings, loading: settingsLoading } = useSettings();
  const { t } = useT();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<CalcResult | null>(null);

  const reload = useCallback(() => {
    if (authLoading) return;
    let active = true;
    setLoadingHistory(true);
    getHistory({ userId, role, branchId, page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => active && setError(t("common.err_load")))
      .finally(() => active && setLoadingHistory(false));
    return () => {
      active = false;
    };
  }, [authLoading, userId, role, branchId, page, search, t]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  async function handleCalculated(result: CalcResult, meta: EntryMeta) {
    setError(null);
    setLast(result);
    setSaving(true);
    try {
      await saveCalculation(userId, result, meta);
      setPage(0);
      reload();
    } catch {
      setError(t("common.err_save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = items;
    setItems((h) => h.filter((it) => it.id !== id));
    try {
      await deleteCalculation(userId, id);
      reload();
    } catch {
      setItems(prev);
      setError(t("common.err_save"));
    }
  }

  async function handlePrinted(id: string) {
    try {
      await markPrinted(userId, id);
      reload();
    } catch {
      setError(t("common.err_save"));
    }
  }

  async function handleVoid(item: HistoryItem, reason: string) {
    try {
      await voidCalculation(userId, item, reason || t("common.void_default_reason"));
      reload();
    } catch {
      setError(t("common.err_save"));
    }
  }

  return (
    <div className="container">
      {error && <div className="alert error no-print">{error}</div>}

      <DataInput
        config={settings}
        onCalculated={handleCalculated}
        saving={saving || settingsLoading}
      />

      {last && (
        <div className="card no-print">
          <h2>{t("home.latest")}</h2>
          <div className="result-cards">
            <div className="result-card">
              <div className="k">{t("result.lastyear_tax")}</div>
              <div className="result-big">{formatBirr(last.lastYearTax)}</div>
            </div>
            <div className="result-card">
              <div className="k">{t("result.tax_before")}</div>
              <div className="result-big">{formatBirr(last.taxBefore)}</div>
              <div className="muted small">{formatRate(last.curfewRateBefore)}</div>
            </div>
            <div className="result-card">
              <div className="k">{t("result.tax_with")}</div>
              <div className="result-big">{formatBirr(last.taxWith)}</div>
              <div className="muted small">{formatRate(last.curfewRateWith)}</div>
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
        <div className="section-title no-print">
          <h2 style={{ margin: 0 }}>{t("home.history")}</h2>
          <span className="muted small">{t("common.total_entries", { n: String(total) })}</span>
        </div>
        <HistoryList
          items={items}
          total={total}
          loading={loadingHistory}
          page={page}
          pageSize={PAGE_SIZE}
          setPage={setPage}
          search={search}
          setSearch={setSearch}
          role={role}
          onDelete={handleDelete}
          onPrinted={handlePrinted}
          onVoid={handleVoid}
        />
      </div>
    </div>
  );
}
