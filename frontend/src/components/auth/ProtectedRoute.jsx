import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roleRank = { admin: 3, analyst: 2, viewer: 1 };
    if ((roleRank[user.role] || 0) < (roleRank[requiredRole] || 0)) {
      return (
        <div className="flex items-center justify-center h-64 flex-col gap-2">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Access Denied</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            You need <strong>{requiredRole}</strong> role to view this page.
          </p>
        </div>
      );
    }
  }

  return children;
}
