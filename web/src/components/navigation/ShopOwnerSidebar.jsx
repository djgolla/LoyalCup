import { NavLink } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  FolderTree, 
  Settings as SettingsIcon,
  ShoppingBag,
  BarChart3,
  Users,
  Award,
  LogOut,
  UserCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ShopOwnerSidebar() {
  const { shop } = useShop();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const linkClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getStatusBadge = () => {
    if (!shop) return null;
    
    const badges = {
      active: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      pending: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
      suspended: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badges[shop.status] || badges.pending}`}>
        {shop.status}
      </span>
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-xl font-semibold text-amber-700">Shop Owner</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {shop?.name || "My Coffee Shop"}
        </p>
        {getStatusBadge()}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink
          to="/shop-owner"
          end
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/shop-owner/menu"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <MenuIcon size={20} />
          Menu Builder
        </NavLink>

        <NavLink
          to="/shop-owner/categories"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <FolderTree size={20} />
          Categories
        </NavLink>

        <NavLink
          to="/shop-owner/customizations"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <SettingsIcon size={20} />
          Customizations
        </NavLink>

        <NavLink
          to="/shop-owner/orders"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <ShoppingBag size={20} />
          Orders
        </NavLink>

        <NavLink
          to="/shop-owner/analytics"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

        <NavLink
          to="/shop-owner/loyalty"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <Award size={20} />
          Loyalty
        </NavLink>

        <NavLink
          to="/shop-owner/workers"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <Users size={20} />
          Workers
        </NavLink>

        <NavLink
          to="/shop-owner/settings"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <SettingsIcon size={20} />
          Shop Settings
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`
          }
        >
          <UserCircle size={20} />
          Profile
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
        <button
          onClick={handleLogout}
          className={`${linkClasses} w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
