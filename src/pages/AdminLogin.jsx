import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./adminLogin.css";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * DEMO-ONLY admin login. Credentials are hardcoded for class / prototype.
 * Replace with Supabase Auth (or secure backend) before any real deployment.
 */
const DEMO_USER = "admin";
const DEMO_PASS = "123456";

const AUTH_KEY = "admin-auth";

export default function AdminLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const u = username.trim();
    const p = password;

    if (u === DEMO_USER && p === DEMO_PASS) {
      sessionStorage.setItem(AUTH_KEY, "true");
      navigate("/admin", { replace: true });
    } else {
      setError(t("adminLogin.invalid"));
    }
  };

  return (
    <div className="adminLoginPage">
      <div className="adminLoginInner">
        <header className="adminLoginHeader">
          <p className="adminLoginEyebrow">Maye Clinic</p>
          <h1 className="adminLoginTitle">{t("adminLogin.title")}</h1>
          <p className="adminLoginSub">{t("adminLogin.subtitle")}</p>
        </header>

        <form className="adminLoginCard" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="adminLoginError" role="alert">
              {error}
            </div>
          )}

          <div className="adminLoginField">
            <label htmlFor="admin-user">{t("adminLogin.username")}</label>
            <input
              id="admin-user"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="adminLoginField">
            <label htmlFor="admin-pass">{t("adminLogin.password")}</label>
            <input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="adminLoginBtn">
            {t("adminLogin.submit")}
          </button>

          <p className="adminLoginHint">
            {t("adminLogin.hint")}
          </p>
        </form>
      </div>
    </div>
  );
}
