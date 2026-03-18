import { NavLink } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  FolderTree,
  Layers,
  Settings as SettingsIcon,
  ShoppingBag,
  BarChart3,
  Users,
  Award,
  LogOut,
  Download,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ShopOwnerSidebar() {
  const { shop } = useShop();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkClasses =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm";

  const activeClasses = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold";
  const inactiveClasses =
    "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800";

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
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badges[shop.status] || badges.pending}`}>
        {shop.status}
      </span>
    );
  };

  const SectionLabel = ({ children }) => (
    <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
      {children}
    </p>
  );

  return (
    <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 flex flex-col shrink-0">
      {/* Shop header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-xl font-semibold text-amber-700">Shop Owner</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
          {shop?.name || "My Coffee Shop"}
        </p>
        {getStatusBadge()}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {/* Overview */}
        <NavLink
          to="/shop-owner/dashboard"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {/* ── Menu section ── */}
        <SectionLabel>Menu</SectionLabel>

        <NavLink
          to="/shop-owner/menu"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <MenuIcon size={18} />
          Menu Builder
        </NavLink>

        <NavLink
          to="/shop-owner/categories"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <FolderTree size={18} />
          Categories
        </NavLink>

        <NavLink
          to="/shop-owner/customizations"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <Layers size={18} />
          Modifier Groups
        </NavLink>

        {/* ── Operations section ── */}
        <SectionLabel>Operations</SectionLabel>

        <NavLink
          to="/shop-owner/orders"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <ShoppingBag size={18} />
          Orders
        </NavLink>

        <NavLink
          to="/shop-owner/analytics"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <BarChart3 size={18} />
          Analytics
        </NavLink>

        <NavLink
          to="/shop-owner/loyalty"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <Award size={18} />
          Loyalty Program
        </NavLink>

        <NavLink
          to="/shop-owner/workers"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <Users size={18} />
          Workers
        </NavLink>

        {/* ── Settings section ── */}
        <SectionLabel>Settings</SectionLabel>

        <NavLink
          to="/shop-owner/settings"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <SettingsIcon size={18} />
          Shop Settings
        </NavLink>

        <NavLink
          to="/shop-owner/setup"
          className={({ isActive }) => `${linkClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
          <Download size={18} />
          Shop Setup
        </NavLink>

        <NavLink
          to="/shop-owner/connect-square"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
            }`
          }
        >
          <RefreshCw size={18} />
          POS Sync
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}