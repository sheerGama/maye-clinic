import "./footer.css";

export default function Footer() {
  return (
    <footer className="siteFooter">
      © {new Date().getFullYear()} <strong>ذوق</strong> — Maye Clinic
    </footer>
  );
}
