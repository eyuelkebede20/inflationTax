import { useState } from "react";
import { Link } from "react-router-dom";
import { computeResult, type CalcResult } from "../lib/calc";
import { formatRate } from "../lib/format";

interface Props {
  inflationRate: number;
  onCalculated: (result: CalcResult, label: string | null) => void;
  saving: boolean;
}

export default function DataInput({ inflationRate, onCalculated, saving }: Props) {
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(value)) {
      setError("Enter a valid number for the 2017 EC taxable amount.");
      return;
    }
    if (value < 0) {
      setError("The taxable amount can't be negative.");
      return;
    }

    const result = computeResult(value, inflationRate);
    onCalculated(result, label.trim() || null);
    setAmount("");
    setLabel("");
  }

  return (
    <div className="card">
      <h2>New calculation</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Enter the 2017 EC taxable amount. We derive 2016 EC via inflation, then
        compute profit tax and the schedule (curfew) rate for both years.
      </p>

      <form onSubmit={handleCalculate}>
        {error && <div className="alert error">{error}</div>}

        <div className="row">
          <label className="field grow">
            <span className="label">2017 EC taxable amount (Birr)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="e.g. 250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </label>

          <label className="field grow">
            <span className="label">Label (optional)</span>
            <input
              type="text"
              placeholder="e.g. Shop A — 2017"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          <div className="field">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : "Calculate"}
            </button>
          </div>
        </div>
      </form>

      <div className="pill" title="Change this in Settings">
        Inflation rate in use: {formatRate(inflationRate)}{" "}
        <Link to="/profile">change in Settings</Link>
      </div>
    </div>
  );
}
