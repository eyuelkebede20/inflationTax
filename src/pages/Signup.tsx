import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useT();
  const [email, setEmail] = useState("");
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
    const { data, error } = await supabase!.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      navigate("/");
    } else {
      setMessage(t("auth.created"));
    }
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>{t("auth.create_account")}</h2>
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
          <label className="field">
            <span className="label">{t("auth.password")}</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : t("auth.create_account")}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          {t("auth.have_account")} <Link to="/login">{t("auth.signin")}</Link>
          <br />
          <Link to="/">{t("auth.continue_anon")}</Link>
        </p>
      </div>
    </div>
  );
}
