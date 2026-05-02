import { Link } from "react-router-dom";
import "./detailPages.css";

export default function ProductDetails() {
  return (
    <div className="mc-page detailStub" dir="rtl">
      <div className="detailStub-card">
        <h1 className="mc-page-title">تفاصيل المنتج</h1>
        <p className="mc-muted">
          صفحة التفاصيل قيد التطوير. يمكنك العودة إلى المتجر لمتابعة التسوق.
        </p>
        <Link to="/shop" className="detailStub-back">
          العودة إلى المتجر
        </Link>
      </div>
    </div>
  );
}
