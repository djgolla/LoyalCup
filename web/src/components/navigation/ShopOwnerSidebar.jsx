import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Menu as MenuIcon, 
  FolderTree, 
  Settings as SettingsIcon,
  ShoppingBag,
  BarChart3,
  Users,
  Award
} from "lucide-react";

export default function ShopOwnerSidebar() {
  const linkClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200";

  return (
    <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-xl font-semibold text-amber-700">Shop Owner</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">My Coffee Shop</p>
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
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
