import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    navigate("/");
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>{t("auth.signin")}</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
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
            {busy ? <span className="spinner" /> : t("auth.signin")}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          {t("auth.no_account")} <Link to="/signup">{t("auth.create_account")}</Link>
          <br />
          <Link to="/reset-password">{t("auth.forgot")}</Link>
          <br />
          <Link to="/">{t("auth.continue_anon")}</Link>
        </p>
      </div>
    </div>
  );
}
