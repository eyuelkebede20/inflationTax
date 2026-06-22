import { useState } from "react";
import { Link } from "react-router-dom";
import { computeResult, type CalcConfig, type CalcResult } from "../lib/calc";
import { formatRate } from "../lib/format";
import { useT } from "../lib/i18n";

export interface EntryMeta {
  name: string | null;
  tin: string | null;
  businessType: string | null;
}

interface Props {
  config: CalcConfig;
  onCalculated: (result: CalcResult, meta: EntryMeta) => void;
  saving: boolean;
}

export default function DataInput({ config, onCalculated, saving }: Props) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [isService, setIsService] = useState(true);
  const [turnover, setTurnover] = useState("");
  const [lastYearTax, setLastYearTax] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const hasTurnover = turnover.trim() !== "";
    const hasTax = lastYearTax.trim() !== "";
    if (!hasTurnover && !hasTax) {
      setError(t("form.err_need_input"));
      return;
    }

    const tv = Number(turnover);
    const lv = Number(lastYearTax);
    if (
      (hasTurnover && (!Number.isFinite(tv) || tv < 0)) ||
      (hasTax && (!Number.isFinite(lv) || lv < 0))
    ) {
      setError(t("form.err_invalid"));
      return;
    }

    const result = computeResult(config, {
      turnover: hasTurnover ? tv : undefined,
      lastYearTax: hasTax ? lv : undefined,
      isService,
    });
    onCalculated(result, {
      name: name.trim() || null,
      tin: tin.trim() || null,
      businessType: businessType.trim() || null,
    });
    setName("");
    setTin("");
    setBusinessType("");
    setIsService(true);
    setTurnover("");
    setLastYearTax("");
  }

  return (
    <div className="card">
      <h2>{t("form.new_entry")}</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        {t("form.help")}
      </p>

      <form onSubmit={handleCalculate}>
        {error && <div className="alert error">{error}</div>}

        <div className="row">
          <label className="field grow">
            <span className="label">{t("form.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field grow">
            <span className="label">{t("form.tin")}</span>
            <input
              type="text"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
            />
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

        <label className="check-field">
          <input
            type="checkbox"
            checked={isService}
            onChange={(e) => setIsService(e.target.checked)}
          />
          <span>{t("form.is_service")}</span>
        </label>

        <div className="row">
          <label className="field grow">
            <span className="label">{t("form.turnover")}</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="450000"
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
              autoFocus
            />
          </label>
          <label className="field grow">
            <span className="label">{t("form.lastyear_tax")}</span>
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
        {t("common.inflation_in_use")}: {formatRate(config.inflationRate)} · TOT{" "}
        {formatRate(config.totRate)} · {formatRate(config.profitMargin)}{" "}
        <Link to="/profile">{t("common.change_settings")}</Link>
      </div>
    </div>
  );
}
