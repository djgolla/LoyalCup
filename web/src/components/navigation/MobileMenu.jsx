import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, getRole } = useAuth();
  const navigate = useNavigate();
  const role = user ? getRole() : null;

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
        className="rounded-full p-2 text-slate-700 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-neutral-800"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[72px] z-50 border-b border-slate-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <nav className="flex flex-col gap-1 p-4">

            {/* Shop owner / admin: dashboard link */}
            {dashboardPath && (
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-orange-700 transition hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950/30"
                onClick={close}
              >
                <LayoutDashboard size={18} />
                {role === "admin" ? "Admin Dashboard" : "My Dashboard"}
              </Link>
            )}

            {/* Always show: download app */}
            <Link
              to="/download"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-neutral-800"
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
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-neutral-800"
                  onClick={close}
                >
                  Shop Owner Sign In
                </Link>
                <Link
                  to="/shop-application"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-neutral-800"
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
                className="mt-1 flex w-full items-center gap-3 rounded-2xl border-t border-slate-100 px-4 py-3 text-left font-bold text-red-600 transition hover:bg-red-50 dark:border-neutral-800 dark:hover:bg-red-900/20"
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
