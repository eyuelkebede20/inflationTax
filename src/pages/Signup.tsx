import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const navigate = useNavigate();
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
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase!.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is on, there is no active session yet.
    if (data.session) {
      navigate("/");
    } else {
      setMessage(
        "Account created. Check your email to confirm, then sign in."
      );
    }
  }

  return (
    <div className="container center-page">
      <div className="card">
        <h2>Create account</h2>
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
            {busy ? <span className="spinner" /> : "Sign up"}
          </button>
        </form>
        <hr className="divider" />
        <p className="small muted" style={{ margin: 0 }}>
          Already have an account? <Link to="/login">Sign in</Link>
          <br />
          <Link to="/">Continue without signing in →</Link>
        </p>
      </div>
    </div>
  );
}
