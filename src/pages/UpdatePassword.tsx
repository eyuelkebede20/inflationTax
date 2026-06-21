import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    // The reset link establishes a recovery session automatically.
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Password updated. Redirecting…");
    setTimeout(() => navigate("/"), 1200);
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>Set a new password</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Open this page from the link in your reset email.
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert ok">{message}</div>}
          <label className="field">
            <span className="label">New password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : "Update password"}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          <Link to="/">Back to calculator</Link>
        </p>
      </div>
    </div>
  );
}
