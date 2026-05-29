import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.user_metadata?.role;

  const close = () => setIsOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
    navigate("/");
  };

  const dashboardPath =
    role === "admin"      ? "/admin/dashboard" :
    role === "shop_owner" ? "/shop-owner/dashboard" :
    null;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 dark:text-gray-300"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-neutral-800 shadow-lg z-50">
          <nav className="flex flex-col p-4 gap-1">

            {/* Shop owner / admin: dashboard link */}
            {dashboardPath && (
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 px-4 py-3 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                onClick={close}
              >
                <LayoutDashboard size={18} />
                {role === "admin" ? "Admin Dashboard" : "My Dashboard"}
              </Link>
            )}

            {/* Always show: download app */}
            <Link
              to="/download"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
              onClick={close}
            >
              <Smartphone size={18} />
              Download the App
            </Link>

            {/* Not logged in: show shop owner sign in + apply */}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  onClick={close}
                >
                  Shop Owner Sign In
                </Link>
                <Link
                  to="/shop-application"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                  onClick={close}
                >
                  List Your Shop
                </Link>
              </>
            )}

            {/* Logged in: sign out */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-left w-full mt-1 border-t border-gray-100 dark:border-neutral-800"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}