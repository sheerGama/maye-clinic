import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./adminLogin.css";

/**
 * DEMO-ONLY admin login. Credentials are hardcoded for class / prototype.
 * Replace with Supabase Auth (or secure backend) before any real deployment.
 */
const DEMO_USER = "admin";
const DEMO_PASS = "123456";

const AUTH_KEY = "admin-auth";

export default function AdminLogin() {
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
      setError("بيانات الدخول غير صحيحة. تحقق من اسم المستخدم وكلمة المرور.");
    }
  };

  return (
    <div className="adminLoginPage">
      <div className="adminLoginInner">
        <header className="adminLoginHeader">
          <p className="adminLoginEyebrow">Maye Clinic</p>
          <h1 className="adminLoginTitle">تسجيل دخول المشرف</h1>
          <p className="adminLoginSub">الوصول إلى لوحة التحكم</p>
        </header>

        <form className="adminLoginCard" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="adminLoginError" role="alert">
              {error}
            </div>
          )}

          <div className="adminLoginField">
            <label htmlFor="admin-user">اسم المستخدم</label>
            <input
              id="admin-user"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="adminLoginField">
            <label htmlFor="admin-pass">كلمة المرور</label>
            <input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="adminLoginBtn">
            تسجيل الدخول
          </button>

          <p className="adminLoginHint">
            نظام تجريبي للمشروع الدراسي فقط — استبدل بمصادقة آمنة (مثل Supabase
            Auth) في الإنتاج.
          </p>
        </form>
      </div>
    </div>
  );
}
