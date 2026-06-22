import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HistoryItem } from "../lib/storage";
import { formatBirr } from "../lib/format";
import { buildShareUrl } from "../lib/share";
import { useT } from "../lib/i18n";

interface Props {
  items: HistoryItem[];
  loading: boolean;
  onDelete: (id: string) => void;
}

type Filter = "all" | "service" | "nonservice";

export default function HistoryList({ items, loading, onDelete }: Props) {
  const navigate = useNavigate();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === "service" && !it.isService) return false;
      if (filter === "nonservice" && it.isService) return false;
      if (!q) return true;
      return [it.name, it.tin, it.businessType]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [items, query, filter]);

  async function share(item: HistoryItem) {
    const url = buildShareUrl(item);
    try {
      if (navigator.share) {
        await navigator.share({ title: "InflaTax", url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 1800);
  }

  function del(item: HistoryItem) {
    if (window.confirm(t("common.delete_confirm"))) onDelete(item.id);
  }

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Print-only header */}
      <div className="print-header">
        <img src="/favicon.svg" alt="" />
        <div>
          <div className="ph-title">InflaTax</div>
          <div className="ph-sub">{t("print.subtitle")}</div>
        </div>
        <div className="ph-date">{new Date().toLocaleDateString()}</div>
      </div>

      {items.length > 0 && (
        <div className="toolbar no-print">
          <input
            type="search"
            className="toolbar-search"
            placeholder={t("common.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="toolbar-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="all">{t("common.filter_all")}</option>
            <option value="service">{t("common.filter_service")}</option>
            <option value="nonservice">{t("common.filter_nonservice")}</option>
          </select>
          <button
            className="btn secondary"
            type="button"
            onClick={() => window.print()}
          >
            🖨 {t("common.print")}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">{t("table.empty")}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">{t("common.no_match")}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th className="col-action no-print" aria-hidden="true"></th>
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
                <th className="col-action no-print" aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} onClick={() => navigate(`/analysis/${item.id}`)}>
                  <td className="col-action no-print">
                    <button
                      className="row-del"
                      title={t("common.delete")}
                      aria-label={t("common.delete")}
                      onClick={(e) => {
                        e.stopPropagation();
                        del(item);
                      }}
                    >
                      ✕
                    </button>
                  </td>
                  <td className="muted">{filtered.length - i}</td>
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
                  <td className="col-action no-print">
                    <button
                      className="row-share"
                      title={t("common.share")}
                      aria-label={t("common.share")}
                      onClick={(e) => {
                        e.stopPropagation();
                        share(item);
                      }}
                    >
                      {copiedId === item.id ? "✓" : "🔗"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
