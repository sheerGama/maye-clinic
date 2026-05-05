import { Navigate } from "react-router-dom";
import { getCurrentUser, isAdminUser } from "../lib/authUser";

export default function AdminRoute({ children }) {
  const user = getCurrentUser();

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
