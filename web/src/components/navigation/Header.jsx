import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CartButton from "./CartButton";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-[#1b1b1b] border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-700">LoyalCup</span>
          </Link>

          {/* desktop navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/shops" className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition">
              Shops
            </Link>
            {user && (
              <>
                <Link to="/orders" className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition">
                  Orders
                </Link>
                <Link to="/rewards" className="text-gray-700 dark:text-gray-300 hover:text-amber-700 transition">
                  Rewards
                </Link>
              </>
            )}
          </nav>

          {/* right side actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <CartButton />
                <UserMenu />
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
              >
                Sign In
              </Link>
            )}
            
            {/* mobile menu */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
