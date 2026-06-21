import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { hasLocalHistory, importLocalHistory } from "../lib/storage";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const hadLocal = hasLocalHistory();
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (hadLocal && data.user) {
      const ok = window.confirm(
        "Import calculations saved on this device into your account?"
      );
      if (ok) {
        try {
          await importLocalHistory(data.user.id);
        } catch {
          /* non-fatal */
        }
      }
    }
    navigate("/");
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          <label className="field">
            <span className="label">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="label">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          No account? <Link to="/signup">Sign up</Link>
          <br />
          <Link to="/reset-password">Forgot password?</Link>
          <br />
          <Link to="/">Continue without signing in →</Link>
        </p>
      </div>
    </div>
  );
}
