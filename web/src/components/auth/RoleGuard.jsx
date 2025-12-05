import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleGuard({ children, roles }) {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(roles)) {
    // redirect based on user's actual role
    const redirectPath = user.role === "admin" ? "/admin/dashboard" :
                        user.role === "shop_owner" ? "/shop-owner" :
                        user.role === "shop_worker" ? "/worker" :
                        "/";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
