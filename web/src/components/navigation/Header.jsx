import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";
import { Coffee, Smartphone } from "lucide-react";

export default function Header() {
  const { user, getRole } = useAuth();
  const role = user ? getRole() : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">

          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#101827] text-white shadow-sm">
              <Coffee className="h-5 w-5 text-orange-400" />
            </span>
            <span className="text-2xl font-black text-slate-950 dark:text-white">LoyalCup</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {(role === "shop_owner" || role === "admin") && (
              <Link
                to={role === "admin" ? "/admin/dashboard" : "/shop-owner/dashboard"}
                className="text-sm font-bold text-slate-600 transition hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400"
              >
                My Dashboard
              </Link>
            )}
            {!user && (
              <>
                <Link to="/pricing" className="text-sm font-bold text-slate-600 transition hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400">Pricing</Link>
                <Link to="/shop-application" className="text-sm font-bold text-slate-600 transition hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400">List Your Shop</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/download"
              className="hidden sm:flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300"
            >
              <Smartphone size={15} />
              Get the App
            </Link>

            {user ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-[#101827] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#182238] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
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
