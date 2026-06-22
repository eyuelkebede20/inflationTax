import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnalysisBoard from "../components/AnalysisBoard";
import { useAuth } from "../hooks/AuthContext";
import { getCalculation, type HistoryItem } from "../lib/storage";
import { useT } from "../lib/i18n";

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const { t } = useT();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !id) return;
    let active = true;
    setLoading(true);
    getCalculation(userId, id)
      .then((found) => active && setItem(found))
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, userId, authLoading]);

  return (
    <div className="container">
      <div style={{ marginBottom: 16 }}>
        <Link to="/" className="linkbtn">
          {t("common.back")}
        </Link>
      </div>

      {loading && (
        <div className="empty">
          <span className="spinner" />
        </div>
      )}
      {error && <div className="alert error">{error}</div>}
      {!loading && !error && !item && (
        <div className="card empty">{t("analysis.not_found")}</div>
      )}
      {item && <AnalysisBoard item={item} />}
    </div>
  );
}
