import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRole } from "../hooks/RoleContext";
import {
  approveVoid,
  createUser,
  getAccount,
  getEmployeeStats,
  getUsersForManager,
  getVoidRequests,
  rejectVoid,
  removeAccount,
  setPassword,
  usernameTaken,
  type Account,
  type StatRow,
  type VoidRequest,
} from "../lib/storage";
import { formatBirr, formatDate } from "../lib/format";
import { useT } from "../lib/i18n";

// Admin = branch manager: manage employees, approve voids, see branch summary.
export default function AdminDashboard() {
  const { t } = useT();
  const { identity, role, branchId, reloadAccounts } = useRole();
  const me = getAccount(identity.id);

  const [team, setTeam] = useState<Account[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [voids, setVoids] = useState<VoidRequest[]>([]);
  const [uName, setUName] = useState("");
  const [uFull, setUFull] = useState("");
  const [uPass, setUPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!me) return;
    setTeam(getUsersForManager(me.id));
    setVoids(getVoidRequests({ role: "admin", branchId }));
    getEmployeeStats(branchId).then(setStats);
  }, [me, branchId]);

  useEffect(refresh, [refresh]);

  if (role !== "admin" || !me) {
    return (
      <div className="container">
        <div className="card empty">{t("admin.need_admin")}</div>
      </div>
    );
  }

  function addUser(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!uName.trim() || uPass.length < 4) {
      setErr(t("admin.err_user"));
      return;
    }
    if (usernameTaken(uName)) {
      setErr(t("admin.err_dupe"));
      return;
    }
    createUser(me!, { username: uName, password: uPass, fullName: uFull });
    setUName("");
    setUFull("");
    setUPass("");
    reloadAccounts();
    refresh();
  }

  function resetPw(u: Account) {
    const pw = window.prompt(t("admin.reset_prompt", { name: u.username }));
    if (pw && pw.length >= 4) {
      setPassword(u.id, pw);
      window.alert(t("admin.reset_done"));
    } else if (pw !== null) {
      window.alert(t("admin.err_user"));
    }
  }

  function remove(u: Account) {
    if (window.confirm(t("admin.remove_confirm", { name: u.username }))) {
      removeAccount(u.id);
      reloadAccounts();
      refresh();
    }
  }

  function decide(v: VoidRequest, ok: boolean) {
    if (ok) approveVoid(v.id, { name: identity.name });
    else rejectVoid(v.id, { name: identity.name });
    refresh();
  }

  const totals = stats.reduce(
    (a, s) => ({
      count: a.count + s.count,
      lastYearTax: a.lastYearTax + s.lastYearTax,
      taaksii2018: a.taaksii2018 + s.taaksii2018,
    }),
    { count: 0, lastYearTax: 0, taaksii2018: 0 }
  );
  const pending = voids.filter((v) => v.status === "pending");

  return (
    <div className="container stack">
      <div className="hero">
        <h1>{t("admin.title")}</h1>
        <p>{t("admin.subtitle", { branch: me.branchName })}</p>
      </div>

      {/* Totals */}
      <div className="result-cards">
        <div className="result-card">
          <div className="k">{t("admin.entries")}</div>
          <div className="result-big">{totals.count}</div>
        </div>
        <div className="result-card">
          <div className="k">{t("admin.team")}</div>
          <div className="result-big">{team.length}</div>
        </div>
        <div className="result-card" style={{ borderColor: "var(--brand)" }}>
          <div className="k">{t("admin.total_2018")}</div>
          <div className="result-big">{formatBirr(totals.taaksii2018)}</div>
        </div>
      </div>

      {/* Team management */}
      <div className="card">
        <h2>{t("admin.team")}</h2>
        <form onSubmit={addUser} className="row">
          <label className="field grow">
            <span className="label">{t("admin.username")}</span>
            <input value={uName} onChange={(e) => setUName(e.target.value)} />
          </label>
          <label className="field grow">
            <span className="label">{t("admin.fullname")}</span>
            <input value={uFull} onChange={(e) => setUFull(e.target.value)} />
          </label>
          <label className="field grow">
            <span className="label">{t("auth.password")}</span>
            <input
              type="password"
              value={uPass}
              onChange={(e) => setUPass(e.target.value)}
            />
          </label>
          <div className="field">
            <button className="btn" type="submit">
              {t("admin.add_user")}
            </button>
          </div>
        </form>
        {err && <div className="alert error">{err}</div>}

        {team.length === 0 ? (
          <p className="muted small">{t("admin.no_team")}</p>
        ) : (
          <ul className="branch-list">
            {team.map((u) => (
              <li key={u.id}>
                <span>
                  <strong>{u.username}</strong>
                  {u.fullName ? ` · ${u.fullName}` : ""}
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button className="btn secondary" onClick={() => resetPw(u)}>
                    {t("admin.reset_pw")}
                  </button>
                  <button className="row-del" onClick={() => remove(u)}>
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Void requests */}
      <div className="card">
        <h2>
          {t("admin.void_requests")}
          {pending.length > 0 && <span className="badge-void"> {pending.length}</span>}
        </h2>
        {voids.length === 0 ? (
          <p className="muted small">{t("admin.no_voids")}</p>
        ) : (
          <ul className="void-list">
            {voids.map((v) => (
              <li key={v.id} className={v.status !== "pending" ? "seen" : ""}>
                <div>
                  <strong>{v.calcName || t("common.untitled")}</strong>
                  <div className="muted small">
                    {v.reason} · {v.requestedByName} · {formatDate(v.createdAt)}
                    {v.status !== "pending" && ` · ${t("admin.void_" + v.status)}`}
                  </div>
                </div>
                {v.status === "pending" && (
                  <span style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => decide(v, true)}>
                      {t("admin.approve")}
                    </button>
                    <button className="btn secondary" onClick={() => decide(v, false)}>
                      {t("admin.reject")}
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Employee summary */}
      <div className="card">
        <div className="section-title">
          <h2 style={{ margin: 0 }}>{t("admin.by_employee")}</h2>
          <Link to="/" className="linkbtn">
            {t("admin.open_entries")}
          </Link>
        </div>
        {stats.length === 0 ? (
          <div className="empty">{t("table.empty")}</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>{t("admin.employee")}</th>
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
    </div>
  );
}
