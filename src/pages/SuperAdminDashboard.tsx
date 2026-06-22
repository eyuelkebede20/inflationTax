import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useRole } from "../hooks/RoleContext";
import {
  createAdmin,
  getAccount,
  getAccounts,
  getAdmins,
  getBranchStats,
  getUsersForManager,
  getVoidRequests,
  removeAccount,
  usernameTaken,
  type Account,
  type StatRow,
  type VoidRequest,
} from "../lib/storage";
import UserManager from "../components/UserManager";
import { formatBirr, formatDate, formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

type Section = "overview" | "admins" | "settings" | "voids";

// Superadmin = top of the hierarchy: creates admins (branch managers), sets the
// global rates, and sees everything overall. Laid out with a side dashboard.
export default function SuperAdminDashboard() {
  const { t } = useT();
  const { reloadAccounts } = useRole();
  const { settings, update, loading: settingsLoading } = useSettings();

  const [section, setSection] = useState<Section>("overview");
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Account[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [voids, setVoids] = useState<VoidRequest[]>([]);

  // create-admin form
  const [aBranch, setABranch] = useState("");
  const [aName, setAName] = useState("");
  const [aFull, setAFull] = useState("");
  const [aPass, setAPass] = useState("");
  const [aErr, setAErr] = useState<string | null>(null);

  // rates form
  const [inflation, setInflation] = useState("");
  const [rental, setRental] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [rateErr, setRateErr] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setAdmins(getAdmins());
    getBranchStats().then(setStats);
    setVoids(getVoidRequests({ role: "superadmin", branchId: null }));
  }, []);

  useEffect(refresh, [refresh]);

  useEffect(() => {
    if (!settingsLoading) {
      setInflation(String(settings.inflationRate));
      setRental(String(settings.rentalShare));
    }
  }, [settingsLoading, settings]);

  function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAErr(null);
    if (!aName.trim() || !aBranch.trim() || aPass.length < 4) {
      setAErr(t("super.err_admin"));
      return;
    }
    if (usernameTaken(aName)) {
      setAErr(t("admin.err_dupe"));
      return;
    }
    createAdmin({ username: aName, password: aPass, branchName: aBranch, fullName: aFull });
    setABranch("");
    setAName("");
    setAFull("");
    setAPass("");
    reloadAccounts();
    refresh();
  }

  function removeAdmin(a: Account) {
    const n = getUsersForManager(a.id).length;
    if (window.confirm(t("super.admin_del_confirm", { name: a.username, n: String(n) }))) {
      removeAccount(a.id);
      reloadAccounts();
      refresh();
    }
  }

  async function saveRates(e: React.FormEvent) {
    e.preventDefault();
    setSavedMsg(null);
    setRateErr(null);
    const iv = Number(inflation);
    const rv = Number(rental);
    if (![iv, rv].every((n) => Number.isFinite(n) && n >= 0)) {
      setRateErr(t("super.err_rates"));
      return;
    }
    await update({ inflationRate: iv, rentalShare: rv });
    setSavedMsg(t("profile.saved"));
  }

  const grandTotal = stats.reduce((a, s) => a + s.taaksii2018, 0);
  const userCount = getAccounts().filter((a) => a.role === "user").length;
  const pendingVoids = voids.filter((v) => v.status === "pending").length;

  const NAV: { key: Section; label: string; badge?: number }[] = [
    { key: "overview", label: t("super.nav_overview") },
    { key: "admins", label: t("super.nav_admins") },
    { key: "settings", label: t("super.nav_settings") },
    { key: "voids", label: t("super.nav_voids"), badge: pendingVoids },
  ];

  return (
    <div className="container">
      <div className="hero">
        <h1>{t("super.title")}</h1>
        <p>{t("super.subtitle")}</p>
      </div>

      <div className="dash">
        <aside className="dash-nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={section === n.key ? "active" : ""}
              onClick={() => setSection(n.key)}
            >
              {n.label}
              {n.badge ? <span className="badge-void"> {n.badge}</span> : null}
            </button>
          ))}
        </aside>

        <main className="dash-main stack">
          {section === "overview" && (
            <>
              <div className="result-cards">
                <div className="result-card">
                  <div className="k">{t("super.admins")}</div>
                  <div className="result-big">{admins.length}</div>
                </div>
                <div className="result-card">
                  <div className="k">{t("super.users")}</div>
                  <div className="result-big">{userCount}</div>
                </div>
                <div className="result-card" style={{ borderColor: "var(--brand)" }}>
                  <div className="k">{t("super.grand_total")}</div>
                  <div className="result-big">{formatBirr(grandTotal)}</div>
                </div>
              </div>

              <div className="card">
                <h2>{t("super.analytics")}</h2>
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
                          <tr key={s.id ?? "none"}>
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
            </>
          )}

          {section === "admins" && !selectedAdminId && (
            <div className="card">
              <h2>{t("super.admins")}</h2>
              <p className="muted small" style={{ marginTop: 0 }}>
                {t("super.admins_help")}
              </p>
              <form onSubmit={addAdmin} className="row">
                <label className="field grow">
                  <span className="label">{t("super.branch_name")}</span>
                  <input type="text" value={aBranch} onChange={(e) => setABranch(e.target.value)} />
                </label>
                <label className="field grow">
                  <span className="label">{t("admin.username")}</span>
                  <input type="text" value={aName} onChange={(e) => setAName(e.target.value)} />
                </label>
                <label className="field grow">
                  <span className="label">{t("admin.fullname")}</span>
                  <input type="text" value={aFull} onChange={(e) => setAFull(e.target.value)} />
                </label>
                <label className="field grow">
                  <span className="label">{t("auth.password")}</span>
                  <input
                    type="password"
                    value={aPass}
                    onChange={(e) => setAPass(e.target.value)}
                  />
                </label>
                <div className="field">
                  <button className="btn" type="submit">
                    {t("super.add_admin")}
                  </button>
                </div>
              </form>
              {aErr && <div className="alert error">{aErr}</div>}

              {admins.length === 0 ? (
                <p className="muted small">{t("super.no_admins")}</p>
              ) : (
                <ul className="branch-list">
                  {admins.map((a) => (
                    <li
                      key={a.id}
                      className="clickable"
                      onClick={() => setSelectedAdminId(a.id)}
                    >
                      <span>
                        <strong>{a.branchName}</strong> · {a.username}
                        <span className="muted small">
                          {" "}
                          · {getUsersForManager(a.id).length} {t("super.users")} ›
                        </span>
                      </span>
                      <button
                        className="row-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAdmin(a);
                        }}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {section === "admins" && selectedAdminId && (() => {
            const admin = getAccount(selectedAdminId);
            if (!admin) {
              setSelectedAdminId(null);
              return null;
            }
            return (
              <div className="card">
                <button
                  className="linkbtn"
                  style={{ marginBottom: 12 }}
                  onClick={() => setSelectedAdminId(null)}
                >
                  {t("super.back_admins")}
                </button>
                <div className="section-title">
                  <h2 style={{ margin: 0 }}>
                    {t("super.sub_of", { branch: admin.branchName })}
                  </h2>
                  <span className="pill">{admin.username}</span>
                </div>
                <p className="muted small">
                  {t("super.add_user_for", { admin: admin.username })}
                </p>
                <UserManager
                  manager={admin}
                  onChange={() => {
                    refresh();
                    reloadAccounts();
                  }}
                />
              </div>
            );
          })()}

          {section === "settings" && (
            <div className="card">
              <h2>{t("super.rates")}</h2>
              <form onSubmit={saveRates}>
                {rateErr && <div className="alert error">{rateErr}</div>}
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
              <p className="muted small">
                {t("super.rate_note", { r: formatRate(settings.rentalShare) })}
              </p>
            </div>
          )}

          {section === "voids" && (
            <div className="card">
              <h2>{t("super.voids")}</h2>
              <p className="muted small" style={{ marginTop: 0 }}>
                {t("super.voids_help")}
              </p>
              {voids.length === 0 ? (
                <p className="muted small">{t("super.no_voids")}</p>
              ) : (
                <ul className="void-list">
                  {voids.map((v) => (
                    <li key={v.id} className={v.status !== "pending" ? "seen" : ""}>
                      <div>
                        <strong>{v.calcName || t("common.untitled")}</strong>
                        <span className={`badge-void`}> {t("admin.void_" + v.status)}</span>
                        <div className="muted small">
                          {v.reason} · {v.requestedByName}
                          {v.decidedByName ? ` → ${v.decidedByName}` : ""} ·{" "}
                          {formatDate(v.createdAt)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
