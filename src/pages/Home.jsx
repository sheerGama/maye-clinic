import { Link } from "react-router-dom";
import "./home.css";

/* Hero + skin category: same modest skincare photo (bundled once) */
import heroImg from "../assets/skin-bg.jpg";
/* Category card backgrounds — see REPORT_13 */
import laserBg from "../assets/laser-bg.jpg";
import productsBg from "../assets/products-bg.jpg";
import { useLanguage } from "../i18n/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="homeWrap">
      {/* HERO */}
      <section className="hero">
        <div className="heroCard">
          <div className="heroText">
            <p className="badgeText">{t("home.badge")}</p>
            <h1>
              {t("home.title")}
              <span> {t("home.titleHighlight")}</span>
            </h1>
            <p className="sub">{t("home.subtitle")}</p>

            <div className="heroBtns">
              <Link to="/booking" className="btnPrimary">
                {t("home.bookNow")}
              </Link>
              <Link to="/services" className="btnGhost">
                {t("home.services")}
              </Link>
            </div>
          </div>

          <div className="heroCircleWrap">
            <div className="heroCircle">
              <img
                src={heroImg}
                alt={t("home.heroImageAlt")}
                className="heroCircleImg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="catsSection">
        <div className="catsHeader">
          <p className="catsTag">{t("home.topCategories")}</p>
          <h2 className="catsTitle">{t("home.shopByCategory")}</h2>
          <p className="catsSub">{t("home.categorySub")}</p>
        </div>

        <div className="catsRow">
          <Link
            className="catCard catLaser"
            to="/services/laser"
            style={{ backgroundImage: `url(${laserBg})` }}
          >
            <div className="catCircle">
              <h4>{t("home.laser")}</h4>
              <span>{t("home.sessions")}</span>
            </div>
          </Link>

          <Link
            className="catCard catSkin"
            to="/services/skin"
            style={{ backgroundImage: `url(${heroImg})` }}
          >
            <div className="catCircle">
              <h4>{t("home.skinSessions")}</h4>
              <span>{t("home.care")}</span>
            </div>
          </Link>

          <Link
            className="catCard catProducts"
            to="/shop"
            style={{ backgroundImage: `url(${productsBg})` }}
          >
            <div className="catCircle">
              <h4>{t("home.products")}</h4>
              <span>{t("home.store")}</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
