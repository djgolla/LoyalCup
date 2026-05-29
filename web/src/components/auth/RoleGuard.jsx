import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleGuard({ children, roles }) {
  const { user, loading, hasRole } = useAuth();

  // Don't redirect while auth is still resolving (prevents flash-redirect on refresh)
  if (loading) return null;

  // Not logged in → send to login page so shop owners with expired sessions
  // land on the sign-in form, not the public marketing page with no obvious way back
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(roles)) {
    const userRole = user.user_metadata?.role || 'customer';
    const redirectPath =
      userRole === "admin"       ? "/admin/dashboard" :
      userRole === "shop_owner"  ? "/shop-owner/dashboard" :
      userRole === "shop_worker" ? "/worker" :
      "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}