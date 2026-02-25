import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleGuard({ children, roles }) {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(roles)) {
    // redirect based on user's actual role
    const userRole = user.user_metadata?.role || 'customer';
    const redirectPath = userRole === "admin" ? "/admin/dashboard" :
                        userRole === "shop_owner" ? "/shop-owner" :
                        userRole === "shop_worker" ? "/worker" :
                        "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
