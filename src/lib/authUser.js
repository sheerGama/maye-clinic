function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  // Generic user payload support (for apps storing full user objects)
  const localUser = safeParse(localStorage.getItem("user"));
  if (localUser && typeof localUser === "object") return localUser;

  // Keep compatibility with existing demo admin gate in this project
  const isDemoAdmin = sessionStorage.getItem("admin-auth") === "true";
  if (isDemoAdmin) return { role: "admin", isAdmin: true };

  return null;
}

export function isAdminUser(user) {
  return Boolean(user?.isAdmin || user?.role === "admin");
}
