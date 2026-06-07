import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../ui/PageLoader";

export default function RoleGuard({ children, roles }) {
  const { user, loading, hasRole } = useAuth();

  // CRITICAL: Return null while loading - don't redirect yet
  // This gives onAuthStateChange time to parse recovery token from email link
  if (loading) return <PageLoader />;

  // Not logged in → send to login page
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