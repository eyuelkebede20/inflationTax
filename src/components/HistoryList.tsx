import { useNavigate } from "react-router-dom";
import type { HistoryItem } from "../lib/storage";
import { formatBirr, formatDate } from "../lib/format";

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
        No calculations yet. Run one above and it will appear here.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="history-table">
        <thead>
          <tr>
            <th>When / Label</th>
            <th className="num">2017 taxable</th>
            <th className="num">2017 profit tax</th>
            <th className="num">2017 curfew</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} onClick={() => navigate(`/analysis/${item.id}`)}>
              <td>
                <div style={{ fontWeight: 600 }}>
                  {item.label || "Untitled"}
                </div>
                <div className="muted small">{formatDate(item.createdAt)}</div>
              </td>
              <td className="num">{formatBirr(item.taxable2017)}</td>
              <td className="num">{formatBirr(item.profitTax2017)}</td>
              <td className="num">{formatBirr(item.curfew2017)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
