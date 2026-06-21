import { useState } from "react";
import { Link } from "react-router-dom";
import { computeResult, type CalcResult } from "../lib/calc";
import { formatRate } from "../lib/format";

interface Props {
  inflationRate: number;
  onCalculated: (result: CalcResult, businessType: string | null) => void;
  saving: boolean;
}

export default function DataInput({ inflationRate, onCalculated, saving }: Props) {
  const [businessType, setBusinessType] = useState("");
  const [taxable, setTaxable] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(taxable);
    if (taxable.trim() === "" || !Number.isFinite(value) || value < 0) {
      setError("Enter a valid (non-negative) taxable amount.");
      return;
    }

    const result = computeResult(value, inflationRate);
    onCalculated(result, businessType.trim() || null);
    setBusinessType("");
    setTaxable("");
  }

  return (
    <div className="card">
      <h2>New entry</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Enter a taxable amount. InflaTax computes the profit tax and curfew tax
        on it, then inflates it by the current rate to show how much more tax is
        owed this year.
      </p>

      <form onSubmit={handleCalculate}>
        {error && <div className="alert error">{error}</div>}

        <div className="row">
          <label className="field grow">
            <span className="label">Business type (optional)</span>
            <input
              type="text"
              placeholder="e.g. Retail shop"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
          </label>

          <label className="field grow">
            <span className="label">Taxable amount (Birr)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="e.g. 450000"
              value={taxable}
              onChange={(e) => setTaxable(e.target.value)}
              autoFocus
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
