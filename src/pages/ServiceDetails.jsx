import { Link } from "react-router-dom";
import "./detailPages.css";

export default function ServiceDetails() {
  return (
    <div className="mc-page detailStub" dir="rtl">
      <div className="detailStub-card">
        <h1 className="mc-page-title">تفاصيل الخدمة</h1>
        <p className="mc-muted">
          صفحة التفاصيل قيد التطوير. يمكنك العودة إلى قائمة الخدمات.
        </p>
        <Link to="/services" className="detailStub-back">
          العودة إلى الخدمات
        </Link>
      </div>
    </div>
  );
}
