import { useNavigate } from "react-router-dom";
import type { HistoryItem } from "../lib/storage";
import { formatBirr } from "../lib/format";
import { useT } from "../lib/i18n";

interface Props {
  items: HistoryItem[];
  loading: boolean;
}

export default function HistoryList({ items, loading }: Props) {
  const navigate = useNavigate();
  const { t } = useT();

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" />
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="empty">{t("table.empty")}</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="history-table">
        <thead>
          <tr>
            <th>{t("table.tl")}</th>
            <th>{t("table.name")}</th>
            <th>{t("table.tin")}</th>
            <th>{t("table.business")}</th>
            <th className="num">{t("table.lastyear_tax")}</th>
            <th className="num">{t("table.sales_before")}</th>
            <th className="num">{t("table.tax_before")}</th>
            <th className="num">{t("table.sales_with")}</th>
            <th className="num">{t("table.tax_with")}</th>
            <th className="num">{t("table.garaagaruma")}</th>
            <th className="num">{t("table.taaksii2018")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} onClick={() => navigate(`/analysis/${item.id}`)}>
              <td className="muted">{items.length - i}</td>
              <td style={{ fontWeight: 600 }}>
                {item.name || t("common.untitled")}
              </td>
              <td className="muted">{item.tin || "—"}</td>
              <td>{item.businessType || "—"}</td>
              <td className="num">{formatBirr(item.lastYearTax)}</td>
              <td className="num">{formatBirr(item.turnover)}</td>
              <td className="num">{formatBirr(item.taxBefore)}</td>
              <td className="num">{formatBirr(item.salesWith)}</td>
              <td className="num">{formatBirr(item.taxWith)}</td>
              <td className="num">{formatBirr(item.garaagaruma)}</td>
              <td className="num" style={{ fontWeight: 700 }}>
                {formatBirr(item.taaksiiBara2018)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
