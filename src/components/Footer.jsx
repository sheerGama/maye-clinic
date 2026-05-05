import "./footer.css";
import { useLanguage } from "../i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="siteFooter">
      © {new Date().getFullYear()} <strong>ذوق</strong> — Maye Clinic.{" "}
      {t("footer.copyright")}
    </footer>
  );
}
