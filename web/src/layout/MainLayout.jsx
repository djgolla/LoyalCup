import { Outlet, Link } from "react-router-dom";
import Header from "../components/navigation/Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-white dark:bg-[#1b1b1b] border-t border-gray-200 dark:border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-amber-700 mb-3">LoyalCup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your favorite local coffee shops, all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">For Customers</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/download" className="hover:text-amber-700 transition">Download App</Link></li>
                <li><Link to="/about"    className="hover:text-amber-700 transition">About Us</Link></li>
                <li><Link to="/contact"  className="hover:text-amber-700 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">For Shop Owners</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/pricing"          className="hover:text-amber-700 transition">Pricing</Link></li>
                <li><Link to="/shop-application" className="hover:text-amber-700 transition">Apply to Join</Link></li>
                <li><Link to="/login"            className="hover:text-amber-700 transition">Shop Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/privacy" className="hover:text-amber-700 transition">Privacy Policy</Link></li>
                <li><Link to="/terms"   className="hover:text-amber-700 transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-800 text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} LoyalCup. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}