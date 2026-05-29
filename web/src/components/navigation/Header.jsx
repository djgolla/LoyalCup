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

          {/* Center nav — only visible on desktop, only shows shop-owner-relevant links */}
          <nav className="hidden md:flex items-center gap-6">
            {(role === "shop_owner" || role === "admin") && (
              <Link
                to={role === "admin" ? "/admin/dashboard" : "/shop-owner/dashboard"}
                className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition font-medium"
              >
                My Dashboard
              </Link>
            )}
            {!user && (
              <>
                <Link to="/pricing"          className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition">Pricing</Link>
                <Link to="/shop-application" className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition">List Your Shop</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {/* Download app pill — always present, customers live here */}
            <Link
              to="/download"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-full text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
            >
              <Smartphone size={15} />
              Get the App
            </Link>

            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-sm font-semibold"
              >
                Shop Owner Sign In
              </Link>
            )}

            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}