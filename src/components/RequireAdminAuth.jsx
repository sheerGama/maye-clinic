import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Wraps /admin content. Redirects to /admin-login if sessionStorage "admin-auth"
 * is not "true".
 *
 * SECURITY: Demo-only gate. Replace with Supabase Auth (or similar) for production.
 */
export default function RequireAdminAuth({ children }) {
  const navigate = useNavigate();
  const ok =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem("admin-auth") === "true";

  useEffect(() => {
    if (!ok) {
      navigate("/admin-login", { replace: true });
    }
  }, [ok, navigate]);

  if (!ok) return null;
  return children;
}
