import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../ui/PageLoader";

export default function RoleGuard({ children, roles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasRole(roles)) {
    const userRole = user.user_metadata?.role || "customer";

    const redirectPath =
      userRole === "admin"
        ? "/admin/dashboard"
        : userRole === "shop_owner"
          ? "/shop-owner/dashboard"
          : userRole === "shop_worker"
            ? "/worker"
            : "/";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}