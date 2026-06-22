import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRole } from "../hooks/RoleContext";
import { getBranchStats, getBranches, type BranchStat } from "../lib/storage";
import { formatBirr } from "../lib/format";
import { useT } from "../lib/i18n";

// Admin view: the totals for the admin's own branch + the people in it.
export default function AdminDashboard() {
  const { t } = useT();
  const { branchId } = useRole();
  const [stats, setStats] = useState<BranchStat[]>([]);
  const [loading, setLoading] = useState(true);

  const branchName =
    getBranches().find((b) => b.id === branchId)?.name ?? t("admin.no_branch");

  useEffect(() => {
    let active = true;
    getBranchStats()
      .then((s) => {
        if (!active) return;
        setStats(branchId ? s.filter((x) => x.branchId === branchId) : s);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [branchId]);

  const totals = stats.reduce(
    (a, s) => ({
      count: a.count + s.count,
      taaksii2018: a.taaksii2018 + s.taaksii2018,
      lastYearTax: a.lastYearTax + s.lastYearTax,
    }),
    { count: 0, taaksii2018: 0, lastYearTax: 0 }
  );

  return (
    <div className="container">
      <div className="hero">
        <h1>{t("admin.title")}</h1>
        <p>{t("admin.subtitle", { branch: branchName })}</p>
      </div>

      {loading ? (
        <div className="empty">
          <span className="spinner" />
        </div>
      ) : (
        <>
          <div className="result-cards">
            <div className="result-card">
              <div className="k">{t("admin.entries")}</div>
              <div className="result-big">{totals.count}</div>
            </div>
            <div className="result-card">
              <div className="k">{t("admin.total_lastyear")}</div>
              <div className="result-big">{formatBirr(totals.lastYearTax)}</div>
            </div>
            <div className="result-card" style={{ borderColor: "var(--brand)" }}>
              <div className="k">{t("admin.total_2018")}</div>
              <div className="result-big">{formatBirr(totals.taaksii2018)}</div>
            </div>
          </div>

          <div className="card">
            <p className="muted small" style={{ marginTop: 0 }}>
              {t("admin.review_note")} <Link to="/">{t("admin.open_entries")}</Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
