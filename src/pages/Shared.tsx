import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AnalysisBoard from "../components/AnalysisBoard";
import { decodeShare } from "../lib/share";
import { useT } from "../lib/i18n";

export default function Shared() {
  const [params] = useSearchParams();
  const { t } = useT();
  const data = params.get("d") ?? "";
  const item = useMemo(() => (data ? decodeShare(data) : null), [data]);

  return (
    <div className="container">
      <div className="section-title" style={{ marginBottom: 16 }}>
        <span className="pill">{t("shared.title")}</span>
        <Link to="/" className="linkbtn">
          {t("shared.open_app")}
        </Link>
      </div>

      {item ? (
        <AnalysisBoard item={item} />
      ) : (
        <div className="card empty">{t("shared.invalid")}</div>
      )}
    </div>
  );
}
