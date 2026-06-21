import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
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
    else setMessage("Check your email for a password reset link.");
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>Reset password</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          We'll email you a link to set a new password.
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert ok">{message}</div>}
          <label className="field">
            <span className="label">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="btn block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : "Send reset link"}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
