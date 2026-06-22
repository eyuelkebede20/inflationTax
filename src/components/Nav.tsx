import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useRole } from "../hooks/RoleContext";
import { SUPERADMIN_ID } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { AUTH_ENABLED } from "../config";
import { LANGS, useT } from "../lib/i18n";

export default function Nav() {
  const { user, enabled } = useAuth();
  const { identity, setIdentityId, accounts, role } = useRole();
  const { lang, setLang, t } = useT();
  const navigate = useNavigate();

  async function signOut() {
    await supabase?.auth.signOut();
    navigate("/");
  }

  // Dashboards visible per role. Superadmin sees everything.
  const showAdmin = role === "admin" || role === "superadmin";
  const showSuper = role === "superadmin";

  const admins = accounts.filter((a) => a.role === "admin");
  const users = accounts.filter((a) => a.role === "user");

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
          {/* Dev identity switcher — remove once real auth is enabled. */}
          {!AUTH_ENABLED && (
            <select
              className="dev-switch-select"
              title={t("nav.dev_role")}
              value={identity.id}
              onChange={(e) => setIdentityId(e.target.value)}
            >
              <option value={SUPERADMIN_ID}>★ {t("nav.superadmin")}</option>
              {admins.length > 0 && (
                <optgroup label={t("nav.admin")}>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.branchName} · {a.username}
                    </option>
                  ))}
                </optgroup>
              )}
              {users.length > 0 && (
                <optgroup label={t("nav.dashboard")}>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.branchName} · {u.username}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
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
