import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { resetHistory } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

export default function Profile() {
  const { user, enabled } = useAuth();
  const userId = user?.id ?? null;
  const { settings, update, loading } = useSettings();
  const { t } = useT();

  const [inflation, setInflation] = useState("");
  const [tot, setTot] = useState("");
  const [margin, setMargin] = useState("");
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);

  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setInflation(String(settings.inflationRate));
      setTot(String(settings.totRate));
      setMargin(String(settings.profitMargin));
    }
  }, [loading, settings]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg(null);
    setSettingsErr(null);
    const iv = Number(inflation);
    const tv = Number(tot);
    const mv = Number(margin);
    if (
      [iv, tv, mv].some((n) => !Number.isFinite(n) || n < 0)
    ) {
      setSettingsErr(t("profile.err_settings"));
      return;
    }
    try {
      await update({ inflationRate: iv, totRate: tv, profitMargin: mv });
      setSettingsMsg(t("profile.saved"));
    } catch (err) {
      setSettingsErr((err as Error).message);
    }
  }

  async function handleReset() {
    if (!window.confirm(t("profile.reset_confirm"))) return;
    try {
      await resetHistory(userId);
      setResetMsg(t("profile.reset_done"));
    } catch (err) {
      setResetMsg(`Error: ${(err as Error).message}`);
    }
  }

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

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="linkbtn">
          {t("common.back")}
        </Link>
      </div>

      <div className="hero">
        <h1>{t("profile.title")}</h1>
        <p>
          {enabled && user
            ? t("profile.signed_in_as", { email: user.email ?? "" })
            : t("profile.anon")}
        </p>
      </div>

      {/* Settings */}
      <div className="card">
        <h2>{t("profile.settings")}</h2>
        <form onSubmit={saveSettings}>
          {settingsErr && <div className="alert error">{settingsErr}</div>}
          {settingsMsg && <div className="alert ok">{settingsMsg}</div>}
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
              <span className="label">{t("profile.tot_rate")}</span>
              <input
                type="number"
                step="any"
                min="0"
                value={tot}
                onChange={(e) => setTot(e.target.value)}
              />
            </label>
            <label className="field grow">
              <span className="label">{t("profile.margin")}</span>
              <input
                type="number"
                step="any"
                min="0"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
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

      {/* Reset history */}
      <div className="card">
        <h2>{t("profile.reset_title")}</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          {t("profile.reset_help")}
        </p>
        {resetMsg && <div className="alert info">{resetMsg}</div>}
        <button className="btn danger" onClick={handleReset}>
          {t("profile.reset_btn")}
        </button>
      </div>

      {/* Account */}
      {enabled && (
        <div className="card">
          <h2>{t("profile.account")}</h2>
          {user ? (
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
            <p className="muted">
              <Link to="/login">{t("nav.signin")}</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
