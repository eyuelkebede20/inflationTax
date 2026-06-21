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
  const [tax2017, setTax2017] = useState("");
  const [sales, setSales] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const taxVal = Number(tax2017);
    const salesVal = Number(sales);

    if (tax2017.trim() === "" || !Number.isFinite(taxVal) || taxVal < 0) {
      setError("Enter a valid (non-negative) 2017 total tax paid.");
      return;
    }
    if (sales.trim() === "" || !Number.isFinite(salesVal) || salesVal < 0) {
      setError("Enter a valid (non-negative) 2017 sales amount.");
      return;
    }

    const result = computeResult(taxVal, salesVal, inflationRate);
    onCalculated(result, businessType.trim() || null);
    setBusinessType("");
    setTax2017("");
    setSales("");
  }

  return (
    <div className="card">
      <h2>New entry</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Enter the business and its 2017 figures. InflaTax inflates 2017 sales by
        the current rate, finds the new tax bracket, and computes the 2018 tax.
      </p>

      <form onSubmit={handleCalculate}>
        {error && <div className="alert error">{error}</div>}

        <div className="row">
          <label className="field grow">
            <span className="label">Business type (Gosa daldala)</span>
            <input
              type="text"
              placeholder="e.g. Retail shop"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
          </label>

          <label className="field grow">
            <span className="label">2017 total tax paid (Birr)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="e.g. 50370"
              value={tax2017}
              onChange={(e) => setTax2017(e.target.value)}
            />
          </label>

          <label className="field grow">
            <span className="label">2017 sales before inflation (Birr)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="e.g. 450000"
              value={sales}
              onChange={(e) => setSales(e.target.value)}
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
