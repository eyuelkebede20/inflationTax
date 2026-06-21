import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useSettings } from "../hooks/useSettings";
import { resetHistory } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { formatRate } from "../lib/format";

export default function Profile() {
  const { user, enabled } = useAuth();
  const userId = user?.id ?? null;
  const { inflationRate, updateRate, loading } = useSettings();

  // ---- Settings ----
  const [rateInput, setRateInput] = useState("");
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);

  // ---- Reset ----
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // ---- Password ----
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg(null);
    setSettingsErr(null);
    const value = Number(rateInput);
    if (rateInput.trim() === "" || !Number.isFinite(value) || value < 0) {
      setSettingsErr("Inflation rate must be a non-negative number (e.g. 0.152).");
      return;
    }
    try {
      await updateRate(value);
      setSettingsMsg(`Saved. Now using ${formatRate(value)}.`);
      setRateInput("");
    } catch (err) {
      setSettingsErr((err as Error).message);
    }
  }

  async function handleReset() {
    if (
      !window.confirm(
        "Delete ALL of your saved calculations? This cannot be undone."
      )
    )
      return;
    try {
      await resetHistory(userId);
      setResetMsg("All history deleted.");
    } catch (err) {
      setResetMsg(`Error: ${(err as Error).message}`);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (newPassword.length < 6) {
      setPwErr("Password must be at least 6 characters.");
      return;
    }
    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    if (error) setPwErr(error.message);
    else {
      setPwMsg("Password updated.");
      setNewPassword("");
    }
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="linkbtn">
          ← Back to calculator
        </Link>
      </div>

      <div className="hero">
        <h1>Profile</h1>
        <p>
          {enabled
            ? user
              ? `Signed in as ${user.email}`
              : "You're using InflaTax anonymously — settings and history stay on this device."
            : "Anonymous mode — settings and history stay on this device."}
        </p>
      </div>

      {/* Settings */}
      <div className="card">
        <h2>Settings</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Current inflation rate: <strong>{formatRate(inflationRate)}</strong>{" "}
          {loading && <span className="spinner" />}
        </p>
        <form onSubmit={saveSettings}>
          {settingsErr && <div className="alert error">{settingsErr}</div>}
          {settingsMsg && <div className="alert ok">{settingsMsg}</div>}
          <div className="row">
            <label className="field grow">
              <span className="label">
                New inflation rate (decimal, e.g. 0.152 for 15.2%)
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder={String(inflationRate)}
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
              />
            </label>
            <div className="field">
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Reset history */}
      <div className="card">
        <h2>Reset history</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          Permanently delete every saved calculation
          {userId ? " in your account" : " on this device"}.
        </p>
        {resetMsg && <div className="alert info">{resetMsg}</div>}
        <button className="btn danger" onClick={handleReset}>
          Delete all history
        </button>
      </div>

      {/* Account */}
      {enabled && (
        <div className="card">
          <h2>Account</h2>
          {user ? (
            <form onSubmit={changePassword}>
              {pwErr && <div className="alert error">{pwErr}</div>}
              {pwMsg && <div className="alert ok">{pwMsg}</div>}
              <div className="row">
                <label className="field grow">
                  <span className="label">Change password</span>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <div className="field">
                  <button className="btn" type="submit">
                    Update
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p className="muted">
              <Link to="/login">Sign in</Link> or{" "}
              <Link to="/signup">create an account</Link> to sync your history
              and settings across devices. Forgot your password?{" "}
              <Link to="/reset-password">Reset it</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
