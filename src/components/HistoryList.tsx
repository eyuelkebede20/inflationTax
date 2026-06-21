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
            <th className="num">2017 tax paid</th>
            <th className="num">Sales (pre-infl.)</th>
            <th className="num">Tax (pre-infl.)</th>
            <th className="num">Sales (infl.)</th>
            <th className="num">Tax (infl.)</th>
            <th className="num">Difference</th>
            <th className="num">2018 tax</th>
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
              <td className="num">{formatBirr(item.tax2017Paid)}</td>
              <td className="num">{formatBirr(item.salesBefore)}</td>
              <td className="num">{formatBirr(item.taxBefore)}</td>
              <td className="num">{formatBirr(item.salesWith)}</td>
              <td className="num">{formatBirr(item.taxWith)}</td>
              <td className="num">{formatBirr(item.difference)}</td>
              <td className="num" style={{ fontWeight: 700 }}>
                {formatBirr(item.tax2018)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
