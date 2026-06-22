import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HistoryItem } from "../lib/storage";
import type { Role } from "../hooks/RoleContext";
import { formatBirr } from "../lib/format";
import { buildShareUrl } from "../lib/share";
import { printCard } from "../lib/printCard";
import { useT } from "../lib/i18n";

interface Props {
  items: HistoryItem[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  setPage: (n: number) => void;
  search: string;
  setSearch: (s: string) => void;
  role: Role;
  onDelete: (id: string) => void;
  onPrinted: (id: string) => void;
  onVoid: (item: HistoryItem, reason: string) => void;
}

export default function HistoryList(props: Props) {
  const { items, total, loading, page, pageSize, setPage, search, setSearch, role } = props;
  const navigate = useNavigate();
  const { t } = useT();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canVoid = role === "admin" || role === "superadmin";
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstIndex = page * pageSize;

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
    if (window.confirm(t("common.delete_confirm"))) props.onDelete(item.id);
  }

  function voidRow(item: HistoryItem) {
    const reason = window.prompt(
      t(canVoid ? "common.void_prompt" : "common.request_void_prompt")
    );
    if (reason && reason.trim()) props.onVoid(item, reason.trim());
    else if (reason !== null) window.alert(t("common.void_need_reason"));
  }

  async function printRow(item: HistoryItem) {
    await printCard(item, {
      title: t("print.card_title"),
      subtitle: t("print.subtitle"),
      name: t("table.name"),
      tin: t("table.tin"),
      business: t("table.business"),
      kind: t("form.kind"),
      kind_tax: t("form.kind_tax"),
      kind_rental: t("form.kind_rental"),
      lastyear_tax: t("table.lastyear_tax"),
      sales_before: t("table.sales_before"),
      tax_before: t("table.tax_before"),
      sales_with: t("table.sales_with"),
      tax_with: t("table.tax_with"),
      garaagaruma: t("table.garaagaruma"),
      taaksii2018: t("table.taaksii2018"),
    });
    if (!item.locked) props.onPrinted(item.id);
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

      {(total > 0 || search) && (
        <div className="toolbar no-print">
          <input
            type="search"
            className="toolbar-search"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <button className="btn secondary" type="button" onClick={() => window.print()}>
            🖨 {t("common.print_all")}
          </button>
        </div>
      )}

      {total === 0 ? (
        <div className="empty">{search ? t("common.no_match") : t("table.empty")}</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th className="col-action no-print" aria-hidden="true" rowSpan={2}></th>
                  <th rowSpan={2}>{t("table.tl")}</th>
                  <th rowSpan={2}>{t("table.name")}</th>
                  <th rowSpan={2}>{t("table.tin")}</th>
                  <th rowSpan={2}>{t("table.business")}</th>
                  <th className="num" rowSpan={2}>{t("table.lastyear_tax")}</th>
                  <th className="num group-head" colSpan={6}>{t("table.group_2018")}</th>
                  <th className="col-action no-print" aria-hidden="true" rowSpan={2}></th>
                </tr>
                <tr>
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
                  <tr
                    key={item.id}
                    className={item.voided ? "row-voided" : item.locked ? "row-locked" : ""}
                    onClick={() => navigate(`/analysis/${item.id}`)}
                  >
                    <td className="col-action no-print">
                      {item.voided ? (
                        <span className="lock-ico" title={t("common.voided")}>
                          ⦸
                        </span>
                      ) : item.locked ? (
                        canVoid ? (
                          <button
                            className="row-del"
                            title={t("common.void")}
                            aria-label={t("common.void")}
                            onClick={(e) => {
                              e.stopPropagation();
                              voidRow(item);
                            }}
                          >
                            ⦸
                          </button>
                        ) : (
                          <button
                            className="row-share"
                            title={t("common.request_void")}
                            aria-label={t("common.request_void")}
                            onClick={(e) => {
                              e.stopPropagation();
                              voidRow(item);
                            }}
                          >
                            📝
                          </button>
                        )
                      ) : (
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
                      )}
                    </td>
                    <td className="muted">{total - (firstIndex + i)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {item.name || t("common.untitled")}
                      {item.voided && (
                        <span className="badge-void"> {t("common.voided")}</span>
                      )}
                    </td>
                    <td className="muted">{item.tin || "—"}</td>
                    <td>{item.businessType || "—"}</td>
                    <td className="num">{formatBirr(item.lastYearTax)}</td>
                    <td className="num">{formatBirr(item.base)}</td>
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
                        title={t("common.print_card")}
                        aria-label={t("common.print_card")}
                        onClick={(e) => {
                          e.stopPropagation();
                          printRow(item);
                        }}
                      >
                        🖨
                      </button>
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

          {pageCount > 1 && (
            <div className="pager no-print">
              <button
                className="btn secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                ← {t("common.prev")}
              </button>
              <span className="muted small">
                {t("common.page_of", {
                  page: String(page + 1),
                  total: String(pageCount),
                })}
              </span>
              <button
                className="btn secondary"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(page + 1)}
              >
                {t("common.next")} →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
