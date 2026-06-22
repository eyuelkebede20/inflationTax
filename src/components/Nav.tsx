import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useRole, ROLES, type Role } from "../hooks/RoleContext";
import { getBranches } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { AUTH_ENABLED } from "../config";
import { LANGS, useT } from "../lib/i18n";

export default function Nav() {
  const { user, enabled } = useAuth();
  const { role, setRole, branchId, setBranchId } = useRole();
  const { lang, setLang, t } = useT();
  const navigate = useNavigate();
  const branches = getBranches();

  async function signOut() {
    await supabase?.auth.signOut();
    navigate("/");
  }

  // Dashboards visible per role. Auth is off, so the dev switcher decides which
  // role you're previewing; superadmin sees everything.
  const showAdmin = role === "admin" || role === "superadmin";
  const showSuper = role === "superadmin";

  return (
    <nav className="nav no-print">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <img className="logo" src="/favicon.svg" alt="" />
          <span>
            Infla<span className="tag">Tax</span>
          </span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className="nav-link">
            {t("nav.dashboard")}
          </NavLink>
          {showAdmin && (
            <NavLink to="/admin" className="nav-link">
              {t("nav.admin")}
            </NavLink>
          )}
          {showSuper && (
            <NavLink to="/superadmin" className="nav-link">
              {t("nav.superadmin")}
            </NavLink>
          )}
        </div>

        <div className="nav-actions">
          {/* Dev role/branch switcher — remove once real auth is enabled. */}
          {!AUTH_ENABLED && (
            <div className="dev-switch" title={t("nav.dev_role")}>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {role !== "superadmin" && branches.length > 0 && (
                <select
                  value={branchId ?? ""}
                  onChange={(e) => setBranchId(e.target.value || null)}
                >
                  <option value="">{t("nav.all_branches")}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="lang-switch" role="group" aria-label={t("profile.language")}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`lang-btn${lang === l.code ? " active" : ""}`}
                onClick={() => setLang(l.code)}
                type="button"
              >
                {l.label}
              </button>
            ))}
          </div>

          <Link className="btn secondary" to="/profile">
            {t("nav.profile")}
          </Link>
          {AUTH_ENABLED && enabled && user && (
            <button className="btn secondary" onClick={signOut}>
              {t("nav.signout")}
            </button>
          )}
          {AUTH_ENABLED && enabled && !user && (
            <Link className="btn" to="/login">
              {t("nav.signin")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
