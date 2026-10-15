import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("ishq_token");
  const userRaw = localStorage.getItem("ishq_user");

  if (!token || !userRaw || userRaw === "null" || userRaw === "undefined") {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);
    if (!user || typeof user !== "object" || user.role !== "ADMIN") {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
