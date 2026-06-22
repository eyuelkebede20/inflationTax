import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import {
  acknowledgeVoid,
  createBranch,
  deleteBranch,
  getBranches,
  getBranchStats,
  getVoidLog,
  type BranchStat,
  type VoidEntry,
} from "../lib/storage";
import type { Branch } from "../hooks/RoleContext";
import { formatBirr, formatDate, formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

// Superadmin view: branches/admins, global rates, branch analytics, void feed.
export default function SuperAdminDashboard() {
  const { t } = useT();
  const { settings, update, loading: settingsLoading } = useSettings();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranch, setNewBranch] = useState("");
  const [stats, setStats] = useState<BranchStat[]>([]);
  const [voids, setVoids] = useState<VoidEntry[]>([]);

  const [inflation, setInflation] = useState("");
  const [rental, setRental] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function refresh() {
    setBranches(getBranches());
    getBranchStats().then(setStats);
    getVoidLog().then(setVoids);
  }

  useEffect(refresh, []);

  useEffect(() => {
    if (!settingsLoading) {
      setInflation(String(settings.inflationRate));
      setRental(String(settings.rentalShare));
    }
  }, [settingsLoading, settings]);

  async function saveRates(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    setErr(null);
    const iv = Number(inflation);
    const rv = Number(rental);
    if (![iv, rv].every((n) => Number.isFinite(n) && n >= 0)) {
      setErr(t("super.err_rates"));
      return;
    }
    await update({ inflationRate: iv, rentalShare: rv });
    setSavedMsg(t("profile.saved"));
  }

  function addBranch(e: React.FormEvent) {
    e.preventDefault();
    const name = newBranch.trim();
    if (!name) return;
    createBranch(name);
    setNewBranch("");
    refresh();
  }

  function removeBranch(id: string) {
    if (window.confirm(t("super.branch_del_confirm"))) {
      deleteBranch(id);
      refresh();
    }
  }

  function ack(id: string) {
    acknowledgeVoid(id).then(refresh);
  }

  const grandTotal = stats.reduce((a, s) => a + s.taaksii2018, 0);
  const unseenVoids = voids.filter((v) => !v.acknowledged).length;

  return (
    <div className="container stack">
      <div className="hero">
        <h1>{t("super.title")}</h1>
        <p>{t("super.subtitle")}</p>
      </div>

      {/* Global rates */}
      <div className="card">
        <h2>{t("super.rates")}</h2>
        <form onSubmit={saveRates}>
          {err && <div className="alert error">{err}</div>}
          {savedMsg && <div className="alert ok">{savedMsg}</div>}
          <div className="row">
            <label className="field grow">
              <span className="label">{t("profile.inflation_rate")}</span>
              <input
                type="number"
                step="any"
                min="0"
                value={inflation}
                onChange={(e) => setInflation(e.target.value)}
              />
            </label>
            <label className="field grow">
              <span className="label">{t("super.rental_share")}</span>
              <input
                type="number"
                step="any"
                min="0"
                value={rental}
                onChange={(e) => setRental(e.target.value)}
              />
            </label>
            <div className="field">
              <button className="btn" type="submit">
                {t("common.save")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Branches */}
      <div className="card">
        <h2>{t("super.branches")}</h2>
        <form onSubmit={addBranch} className="row">
          <label className="field grow">
            <span className="label">{t("super.branch_name")}</span>
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder={t("super.branch_ph")}
            />
          </label>
          <div className="field">
            <button className="btn" type="submit">
              {t("super.add_branch")}
            </button>
          </div>
        </form>
        {branches.length === 0 ? (
          <p className="muted small">{t("super.no_branches")}</p>
        ) : (
          <ul className="branch-list">
            {branches.map((b) => (
              <li key={b.id}>
                <span>{b.name}</span>
                <button className="row-del" onClick={() => removeBranch(b.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">{t("super.admin_note")}</p>
      </div>

      {/* Branch analytics */}
      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>{t("super.analytics")}</h2>
          <span className="pill">
            {t("super.grand_total")}: {formatBirr(grandTotal)}
          </span>
        </div>
        {stats.length === 0 ? (
          <div className="empty">{t("table.empty")}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>{t("super.branch")}</th>
                  <th className="num">{t("admin.entries")}</th>
                  <th className="num">{t("admin.total_lastyear")}</th>
                  <th className="num">{t("table.garaagaruma")}</th>
                  <th className="num">{t("admin.total_2018")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.branchId ?? "none"}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="num">{s.count}</td>
                    <td className="num">{formatBirr(s.lastYearTax)}</td>
                    <td className="num">{formatBirr(s.garaagaruma)}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {formatBirr(s.taaksii2018)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Void notifications */}
      <div className="card">
        <h2>
          {t("super.voids")}
          {unseenVoids > 0 && <span className="badge-void"> {unseenVoids}</span>}
        </h2>
        {voids.length === 0 ? (
          <p className="muted small">{t("super.no_voids")}</p>
        ) : (
          <ul className="void-list">
            {voids.map((v) => (
              <li key={v.id} className={v.acknowledged ? "seen" : ""}>
                <div>
                  <strong>{v.name || t("common.untitled")}</strong>
                  <div className="muted small">
                    {v.reason} · {formatDate(v.at)}
                  </div>
                </div>
                {!v.acknowledged && (
                  <button className="btn secondary" onClick={() => ack(v.id)}>
                    {t("super.ack")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="muted small">
        {t("super.rate_note", { r: formatRate(settings.rentalShare) })}
      </p>
    </div>
  );
}
