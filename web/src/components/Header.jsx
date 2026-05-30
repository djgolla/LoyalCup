import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";
import { Smartphone } from "lucide-react";

export default function Header() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;

  return (
    <header className="bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-700">LoyalCup</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Primary CTA — always the app */}
            <Link
              to="/download"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"
            >
              <Smartphone size={14} />
              Get the App
            </Link>

            {/* Shop owner access — subtle, secondary */}
            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-400 transition font-medium"
              >
                Shop owner sign in
              </Link>
            )}

            {/* Logged-in shop owner: dashboard shortcut */}
            {(role === "shop_owner" || role === "admin") && (
              <Link
                to={role === "admin" ? "/admin/dashboard" : "/shop-owner/dashboard"}
                className="hidden sm:inline text-sm text-amber-700 dark:text-amber-400 hover:underline font-semibold transition"
              >
                My Dashboard →
              </Link>
            )}

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}