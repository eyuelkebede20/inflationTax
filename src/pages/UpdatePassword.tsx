import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 6) {
      setError(t("auth.pw_min"));
      return;
    }
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage(t("auth.updated"));
    setTimeout(() => navigate("/"), 1200);
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>{t("auth.update_title")}</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          {t("auth.update_help")}
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert ok">{message}</div>}
          <label className="field">
            <span className="label">{t("auth.new_password")}</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : t("auth.update_btn")}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          <Link to="/">{t("common.back")}</Link>
        </p>
      </div>
    </div>
  );
}
