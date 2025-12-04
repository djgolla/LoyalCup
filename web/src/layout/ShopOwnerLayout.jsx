// ShopOwnerLayout.jsx
// Layout for shop owner dashboard with dedicated sidebar

import { Outlet, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Menu, 
  FolderTree, 
  Sliders, 
  Settings, 
  BarChart3, 
  Users, 
  Gift 
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import AccentPicker from "../components/AccentPicker";

export default function ShopOwnerLayout() {
  const linkClasses =
    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      
      {/* left sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 p-4 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-amber-700 select-none">
          Shop Owner
        </h1>

        <nav className="flex flex-col gap-2">
          
          <NavLink
            to="/shop-owner"
            end
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink
            to="/shop-owner/menu-builder"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <Menu size={20} />
            Menu Builder
          </NavLink>

          <NavLink
            to="/shop-owner/categories"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
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
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <Sliders size={20} />
            Customizations
          </NavLink>

          <NavLink
            to="/shop-owner/analytics"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <BarChart3 size={20} />
            Analytics
          </NavLink>

          <NavLink
            to="/shop-owner/workers"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <Users size={20} />
            Workers
          </NavLink>

          <NavLink
            to="/shop-owner/loyalty"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <Gift size={20} />
            Loyalty
          </NavLink>

          <NavLink
            to="/shop-owner/settings"
            className={({ isActive }) =>
              `${linkClasses} ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`
            }
          >
            <Settings size={20} />
            Shop Settings
          </NavLink>

        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <ThemeToggle />
          <AccentPicker />
        </div>
      </aside>

      {/* main content */}
      <div className="flex flex-col flex-1 bg-gray-50 dark:bg-[#181818] transition-colors duration-300">
        
        {/* header */}
        <header className="h-16 bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-neutral-800 px-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">The Loyal Cup - Downtown</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Shop Owner Portal</span>
          </div>
        </header>

        {/* page content */}
        <main className="p-6 overflow-y-auto h-full animate-fadeIn">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
