import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Store,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  FileText
} from "lucide-react";

export default function AdminSidebar() {
  const linkClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200";

  return (
    <aside className="w-64 bg-slate-900 text-white border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-amber-500">Admin Panel</h1>
        <p className="text-sm text-slate-400">LoyalCup Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/shops"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <Store size={20} />
          Shops
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <Users size={20} />
          Users
        </NavLink>

        <NavLink
          to="/admin/analytics"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <BarChart3 size={20} />
          Analytics
        </NavLink>

        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <SettingsIcon size={20} />
          Settings
        </NavLink>

        <NavLink
          to="/admin/audit-log"
          className={({ isActive }) =>
            `${linkClasses} ${
              isActive
                ? "bg-amber-600 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`
          }
        >
          <FileText size={20} />
          Audit Log
        </NavLink>
      </nav>
    </aside>
  );
}
