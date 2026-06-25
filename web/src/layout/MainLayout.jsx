import { Outlet, Link } from "react-router-dom";
import Header from "../components/navigation/Header";
import { Coffee } from "lucide-react";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f6f4f0] dark:bg-neutral-950">
      <Header />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-[#080d19] text-white dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <Link to="/" className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-600">
                  <Coffee className="h-5 w-5" />
                </span>
                <span className="text-xl font-black">LoyalCup</span>
              </Link>
              <p className="max-w-xs text-sm leading-6 text-slate-300">
                Mobile ordering, rewards, and local discovery for coffee shops that deserve a polished app.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-black text-white">For Customers</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to="/download" className="transition hover:text-orange-300">Download App</Link></li>
                <li><Link to="/about" className="transition hover:text-orange-300">About Us</Link></li>
                <li><Link to="/contact" className="transition hover:text-orange-300">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-black text-white">For Shop Owners</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to="/pricing" className="transition hover:text-orange-300">Pricing</Link></li>
                <li><Link to="/shop-application" className="transition hover:text-orange-300">Apply to Join</Link></li>
                <li><Link to="/login" className="transition hover:text-orange-300">Shop Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-black text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to="/privacy" className="transition hover:text-orange-300">Privacy Policy</Link></li>
                <li><Link to="/terms" className="transition hover:text-orange-300">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} LoyalCup. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
