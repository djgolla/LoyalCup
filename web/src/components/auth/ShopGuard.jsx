import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ShopGuard({ children }) {
  const { user } = useAuth();

  // in real app would check if user owns or works at this shop
  // for now just check if they have the right role
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = user.role === "shop_owner" || user.role === "shop_worker" || user.role === "admin";

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}
