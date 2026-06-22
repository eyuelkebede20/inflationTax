import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabase";
import { LANGS, useT } from "../lib/i18n";

export default function Nav() {
  const { user, enabled } = useAuth();
  const { lang, setLang, t } = useT();
  const navigate = useNavigate();

  async function signOut() {
    await supabase?.auth.signOut();
    navigate("/");
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <img className="logo" src="/favicon.svg" alt="" />
          <span>
            Infla<span className="tag">Tax</span>
          </span>
        </Link>
        <div className="nav-actions">
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
          {enabled && user && (
            <button className="btn secondary" onClick={signOut}>
              {t("nav.signout")}
            </button>
          )}
          {enabled && !user && (
            <Link className="btn" to="/login">
              {t("nav.signin")}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
