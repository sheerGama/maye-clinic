import { Link } from "react-router-dom";
import "./home.css";

import badge from "../assets/react.svg";
import skinBg from "../assets/react.svg";
import laserBg from "../assets/react.svg";
import productsBg from "../assets/react.svg";

export default function Home() {
  return (
    <div className="homeWrap">
      {/* HERO */}
      <section className="hero">
        <div className="heroCard">
          <div className="heroText">
            <p className="badgeText">MAYE CLINIC</p>
            <h1>
              العناية بالبشرة والجسم
              <span> بأسلوب فاخر</span>
            </h1>
            <p className="sub">
              رحلة عناية تبدأ بالاهتمام <br />
              وتنتهي بإشراقة تشبهك
            </p>

            <div className="heroBtns">
              <Link to="/booking" className="btnPrimary">
                احجزي الآن
              </Link>
              <Link to="/services" className="btnGhost">
                الخدمات
              </Link>
            </div>
          </div>

          <div className="heroCircleWrap">
            <div className="heroCircle">
              <img src={badge} alt="Maye Clinic" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="catsSection">
        <div className="catsHeader">
          <p className="catsTag">TOP CATEGORIES</p>
          <h2 className="catsTitle">تسوّقي حسب الأقسام</h2>
          <p className="catsSub">اختاري القسم المناسب بسرعة</p>
        </div>

        <div className="catsRow">
          <Link
            className="catCard catLaser"
            to="/services"
            style={{ backgroundImage: `url(${laserBg})` }}
          >
            <div className="catCircle">
              <h4>ليزر</h4>
              <span>جلسات</span>
            </div>
          </Link>

          <Link
            className="catCard catSkin"
            to="/services/skin"
            style={{ backgroundImage: `url(${skinBg})` }}
          >
            <div className="catCircle">
              <h4>جلسات البشرة</h4>
              <span>عناية</span>
            </div>
          </Link>

          <Link
            className="catCard catProducts"
            to="/shop"
            style={{ backgroundImage: `url(${productsBg})` }}
          >
            <div className="catCircle">
              <h4>المنتجات</h4>
              <span>متجر</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
