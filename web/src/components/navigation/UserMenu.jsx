import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, ChevronDown, Coffee, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role        = user.user_metadata?.role || "customer";
  const displayName = user.user_metadata?.full_name || user.email;

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate("/");
  };

  // Customers on the web have no business being logged in here —
  // send them to download with no menu shown
  if (role === "customer") {
    return (
      <Link
        to="/download"
        className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-sm font-semibold"
      >
        Get the App
      </Link>
    );
  }

  const dashboardPath =
    role === "admin"      ? "/admin/dashboard" :
    role === "shop_owner" ? "/shop-owner/dashboard" :
    "/";

  const dashboardLabel =
    role === "admin"      ? "Admin Dashboard" :
    role === "shop_owner" ? "My Dashboard" :
    "Dashboard";

  const DashIcon = role === "admin" ? ShieldCheck : role === "shop_owner" ? Coffee : LayoutDashboard;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
      >
        <DashIcon size={18} className="text-amber-700" />
        <span className="hidden sm:inline text-sm font-medium truncate max-w-[140px]">
          {displayName}
        </span>
        <ChevronDown size={15} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 overflow-hidden">

            {/* Identity header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                {role === "admin" ? "Platform Admin" : "Shop Owner"}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
            </div>

            {/* Dashboard link */}
            <Link
              to={dashboardPath}
              className="flex items-center gap-2 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold transition"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard size={16} />
              {dashboardLabel}
            </Link>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-left text-red-600 border-t border-gray-100 dark:border-neutral-800"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}