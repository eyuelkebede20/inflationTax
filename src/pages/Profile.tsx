import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabase";
import { AUTH_ENABLED } from "../config";
import { useT } from "../lib/i18n";

// Slimmed per idea #6: profile is just the change-password panel now. Global
// rates moved to the Superadmin dashboard.
export default function Profile() {
  const { user, enabled } = useAuth();
  const { t } = useT();

  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (newPassword.length < 6) {
      setPwErr(t("auth.pw_min"));
      return;
    }
    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    if (error) setPwErr(error.message);
    else {
      setPwMsg(t("profile.pw_updated"));
      setNewPassword("");
    }
  }

  const canChange = AUTH_ENABLED && enabled && user;

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="linkbtn">
          {t("common.back")}
        </Link>
      </div>

      <div className="hero">
        <h1>{t("profile.title")}</h1>
      </div>

      <div className="card">
        <h2>{t("profile.account")}</h2>
        {canChange ? (
          <form onSubmit={changePassword}>
            {pwErr && <div className="alert error">{pwErr}</div>}
            {pwMsg && <div className="alert ok">{pwMsg}</div>}
            <div className="row">
              <label className="field grow">
                <span className="label">{t("profile.change_pw")}</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <div className="field">
                <button className="btn" type="submit">
                  {t("profile.update")}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="muted">{t("profile.signin_to_change")}</p>
        )}
      </div>
    </div>
  );
}
