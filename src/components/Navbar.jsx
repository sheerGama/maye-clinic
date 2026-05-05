import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import mayeLogo from "../assets/maye-logo.svg";
import { useLanguage } from "../i18n/LanguageContext";
import { getCurrentUser, isAdminUser } from "../lib/authUser";
import "./navbar.css";

function navClass({ isActive }) {
  return "siteNavLink" + (isActive ? " isActive" : "");
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const user = getCurrentUser();
  const showAdminLink = isAdminUser(user);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="siteNav" aria-label={t("navbar.mainNavigation")}>
      <Link
        to="/"
        className="siteNavBrand"
        onClick={closeMenu}
        aria-label={t("navbar.homeAria")}
      >
        <img
          src={mayeLogo}
          alt=""
          className="siteNavLogo"
          width={46}
          height={46}
          decoding="async"
        />
        <span className="siteNavBrandText">
          <span className="siteNavName">ذوق</span>
          <span className="siteNavTag" lang="en" dir="ltr">
            Maye Clinic
          </span>
        </span>
      </Link>

      <button
        type="button"
        className="siteNavToggle"
        aria-expanded={menuOpen}
        aria-controls="site-nav-links"
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div
        id="site-nav-links"
        className={`siteNavLinks${menuOpen ? " isOpen" : ""}`}
      >
        <NavLink to="/services" className={navClass} end={false} onClick={closeMenu}>
          {t("navbar.services")}
        </NavLink>
        <NavLink to="/booking" className={navClass} onClick={closeMenu}>
          {t("navbar.booking")}
        </NavLink>
        <NavLink to="/shop" className={navClass} onClick={closeMenu}>
          {t("navbar.shop")}
        </NavLink>
        <NavLink to="/cart" className={navClass} onClick={closeMenu}>
          {t("navbar.cart")}
        </NavLink>
        {showAdminLink && (
          <NavLink
            to="/admin"
            className={(p) => navClass(p) + " siteNavLink--admin"}
            onClick={closeMenu}
          >
            {t("navbar.adminLogin")}
          </NavLink>
        )}
        <label className="siteNavLangWrap">
          <span className="siteNavLangLabel">{t("navbar.languageLabel")}</span>
          <select
            className="siteNavLangSelect"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("navbar.languageLabel")}
          >
            <option value="en">{t("navbar.languageEnglish")}</option>
            <option value="ar">{t("navbar.languageArabic")}</option>
            <option value="he">{t("navbar.languageHebrew")}</option>
          </select>
        </label>
      </div>
    </nav>
  );
}
