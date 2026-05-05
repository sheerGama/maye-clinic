import { Link } from "react-router-dom";
import "./detailPages.css";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProductDetails() {
  const { t } = useLanguage();

  return (
    <div className="mc-page detailStub">
      <div className="detailStub-card">
        <h1 className="mc-page-title">{t("productDetails.title")}</h1>
        <p className="mc-muted">{t("productDetails.desc")}</p>
        <Link to="/shop" className="detailStub-back">
          {t("productDetails.back")}
        </Link>
      </div>
    </div>
  );
}
