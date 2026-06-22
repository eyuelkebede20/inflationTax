import { useState } from "react";
import { computeResult, type CalcConfig, type CalcResult, type EntryKind } from "../lib/calc";
import { formatRate } from "../lib/format";
import { useRole } from "../hooks/RoleContext";
import type { EntryMeta } from "../lib/storage";
import { useT } from "../lib/i18n";

interface Props {
  config: CalcConfig;
  onCalculated: (result: CalcResult, meta: EntryMeta) => void;
  saving: boolean;
}

export default function DataInput({ config, onCalculated, saving }: Props) {
  const { t } = useT();
  const { identity } = useRole();
  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [kind, setKind] = useState<EntryKind>("tax");
  const [turnover, setTurnover] = useState("");
  const [lastYearTax, setLastYearTax] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Required: name, TIN, turnover, last-year tax. Business type is optional.
    if (!name.trim() || !tin.trim() || turnover.trim() === "" || lastYearTax.trim() === "") {
      setError(t("form.err_required"));
      return;
    }

    const tv = Number(turnover);
    const lv = Number(lastYearTax);
    if (!Number.isFinite(tv) || tv < 0 || !Number.isFinite(lv) || lv < 0) {
      setError(t("form.err_invalid"));
      return;
    }

    const result = computeResult(config, {
      turnover: tv,
      lastYearTax: lv,
      kind,
    });
    onCalculated(result, {
      name: name.trim(),
      tin: tin.trim(),
      businessType: businessType.trim() || null,
      branchId: identity.branchId,
      ownerId: identity.id,
      ownerName: identity.name,
    });
    setName("");
    setTin("");
    setBusinessType("");
    setKind("tax");
    setTurnover("");
    setLastYearTax("");
  }

  return (
    <div className="card no-print">
      <h2>{t("form.new_entry")}</h2>

      <form onSubmit={handleCalculate}>
        {error && <div className="alert error">{error}</div>}

        <div className="row">
          <label className="field grow">
            <span className="label">{t("form.name")} *</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field grow">
            <span className="label">{t("form.tin")} *</span>
            <input type="text" value={tin} onChange={(e) => setTin(e.target.value)} />
          </label>
          <label className="field grow">
            <span className="label">{t("form.business_type")}</span>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            />
          </label>
        </div>

        <div className="seg" role="group" aria-label={t("form.kind")}>
          <button
            type="button"
            className={`seg-btn${kind === "tax" ? " active" : ""}`}
            onClick={() => setKind("tax")}
          >
            {t("form.kind_tax")}
          </button>
          <button
            type="button"
            className={`seg-btn${kind === "rental" ? " active" : ""}`}
            onClick={() => setKind("rental")}
          >
            {t("form.kind_rental")}
          </button>
        </div>
        {kind === "rental" && (
          <p className="muted small" style={{ marginTop: 6 }}>
            {t("form.rental_note", { pct: formatRate(config.rentalShare) })}
          </p>
        )}

        <div className="row">
          <label className="field grow">
            <span className="label">{t("form.turnover")} *</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="450000"
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
            />
          </label>
          <label className="field grow">
            <span className="label">{t("form.lastyear_tax")} *</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="50370"
              value={lastYearTax}
              onChange={(e) => setLastYearTax(e.target.value)}
            />
          </label>
          <div className="field">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : t("common.calculate")}
            </button>
          </div>
        </div>
      </form>

      <div className="pill">
        {t("common.inflation_in_use")}: {formatRate(config.inflationRate)}
      </div>
    </div>
  );
}
