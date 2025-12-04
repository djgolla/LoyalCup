// Admin sidebar navigation

import { NavLink } from "react-router-dom";
import { Crown, LayoutDashboard, Store, Users, BarChart3, Settings, FileText, LogOut } from "lucide-react";

export default function AdminSidebar() {
  const linkClasses = "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200";

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Crown className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl font-semibold text-white">LoyalCup Admin</h1>
      </div>

      <nav className="flex flex-col gap-1.5">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/shops"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <Store className="w-5 h-5" />
          Shops
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <Users className="w-5 h-5" />
          Users
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          Analytics
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>

        <NavLink
          to="/admin/audit-log"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-500/10 text-amber-500"
                : "text-gray-300 hover:bg-neutral-800"
            }`
          }
        >
          <FileText className="w-5 h-5" />
          Audit Log
        </NavLink>
      </nav>

      <div className="mt-auto pt-4 border-t border-neutral-800">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs text-gray-400">Logged in as</p>
          <p className="text-sm text-white font-medium">djgolla</p>
        </div>
        
        <button className={`${linkClasses} w-full text-gray-300 hover:bg-neutral-800`}>
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
