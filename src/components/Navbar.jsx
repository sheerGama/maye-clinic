import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import mayeLogo from "../assets/maye-logo.svg";
import "./navbar.css";

function navClass({ isActive }) {
  return "siteNavLink" + (isActive ? " isActive" : "");
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="siteNav" aria-label="التنقل الرئيسي">
      <Link
        to="/"
        className="siteNavBrand"
        onClick={closeMenu}
        aria-label="ذوق — Maye Clinic، الصفحة الرئيسية"
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
          <span className="siteNavTag" lang="en">
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
          الخدمات
        </NavLink>
        <NavLink to="/booking" className={navClass} onClick={closeMenu}>
          الحجز
        </NavLink>
        <NavLink to="/shop" className={navClass} onClick={closeMenu}>
          المتجر
        </NavLink>
        <NavLink to="/cart" className={navClass} onClick={closeMenu}>
          السلة
        </NavLink>
        <NavLink
          to="/admin-login"
          className={(p) => navClass(p) + " siteNavLink--admin"}
          onClick={closeMenu}
        >
          دخول المشرف
        </NavLink>
      </div>
    </nav>
  );
}
