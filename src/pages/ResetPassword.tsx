import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

export default function ResetPassword() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setMessage(t("auth.reset_sent"));
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>{t("auth.reset_title")}</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          {t("auth.reset_help")}
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert ok">{message}</div>}
          <label className="field">
            <span className="label">{t("auth.email")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : t("auth.send_reset")}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          <Link to="/login">{t("auth.back_signin")}</Link>
        </p>
      </div>
    </div>
  );
}
