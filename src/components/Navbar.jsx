import { Link } from "react-router-dom";
import badge from "../assets/react.svg";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <img src={badge} alt="Logo" style={styles.logo} />
        <span style={styles.name}>ذوق</span>
      </Link>

      <div style={styles.links}>
        <Link to="/services" style={styles.link}>الخدمات</Link>
        <Link to="/booking" style={styles.link}>الحجز</Link>
        <Link to="/shop" style={styles.link}>المتجر</Link>
        <Link to="/cart" style={styles.link}>السلة</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 22px",
    background: "#f6efe8",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: "50%",
  },
  name: {
    fontFamily: "'Aref Ruqaa', serif",
    fontSize: 28,
    color: "#9c9b8c",
  },
  links: { display: "flex", gap: 16 },
  link: { textDecoration: "none", color: "#2e241d", fontWeight: 600 },
};
