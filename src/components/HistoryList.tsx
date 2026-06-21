import { useNavigate } from "react-router-dom";
import type { HistoryItem } from "../lib/storage";
import { formatBirr, formatBirrDelta, formatDate } from "../lib/format";

interface Props {
  items: HistoryItem[];
  loading: boolean;
}

export default function HistoryList({ items, loading }: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty">
        No entries yet. Add one above and it will appear here.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="history-table">
        <thead>
          <tr>
            <th>Business</th>
            <th className="num">Taxable</th>
            <th className="num">Profit tax</th>
            <th className="num">Curfew tax</th>
            <th className="num">Total tax</th>
            <th className="num">Total w/ inflation</th>
            <th className="num">Extra this year</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} onClick={() => navigate(`/analysis/${item.id}`)}>
              <td>
                <div style={{ fontWeight: 600 }}>
                  {item.businessType || "Untitled"}
                </div>
                <div className="muted small">{formatDate(item.createdAt)}</div>
              </td>
              <td className="num">{formatBirr(item.taxable)}</td>
              <td className="num">{formatBirr(item.profitTaxBase)}</td>
              <td className="num">{formatBirr(item.curfewBase)}</td>
              <td className="num">{formatBirr(item.totalBase)}</td>
              <td className="num">{formatBirr(item.totalInfl)}</td>
              <td className="num delta-up" style={{ fontWeight: 700 }}>
                {formatBirrDelta(item.totalDiff)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
