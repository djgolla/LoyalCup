import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ShopOwnerSidebar from '../components/navigation/ShopOwnerSidebar';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import { CheckCircle, CreditCard, Zap } from 'lucide-react';

const SETUP_ROUTES = [
  '/shop-owner/settings',
  '/shop-owner/connect-square',
  '/shop-owner/subscribe',
];

export default function ShopOwnerLayout() {
  const { shop, loading } = useShop();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Still fetching — show spinner, never render below this
  if (loading) return <PageLoader />;

  // ── /subscribe is ALWAYS allowed through regardless of shop state ─────────
  // Prevents the RLS-lag boot-loop: newly registered applicant navigates here
  // before ShopContext has finished loading their shop row → without this guard
  // they get kicked to /shop-application every time.
  if (location.pathname === '/shop-owner/subscribe') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <main className="p-6 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // No shop — figure out where to send them
  if (!shop) {
    const role = user?.user_metadata?.role;
    // Applicants who lost their shop from RLS → send to subscribe, not application form
    if (role === 'applicant' || role === 'shop_owner') {
      return <Navigate to="/shop-owner/subscribe" replace />;
    }
    // Truly no account — send to application
    return <Navigate to="/shop-application" replace />;
  }

  // ── shop exists from here down — safe to read shop.status ────────────────

  // Pending payment — show subscribe wall (subscribe page handled above)
  if (shop.status === 'pending_payment' || shop.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-800 p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            One Step Away!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Subscribe to activate your shop and unlock your full dashboard instantly.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left text-sm text-amber-800 dark:text-amber-300 space-y-2 mb-6">
            <p className="flex items-center gap-2"><CheckCircle size={14} /> Application received</p>
            <p className="flex items-center gap-2 opacity-50"><CreditCard size={14} /> Subscribe to activate</p>
            <p className="flex items-center gap-2 opacity-30"><CheckCircle size={14} /> Dashboard access unlocked</p>
          </div>
          <button
            onClick={() => navigate('/shop-owner/subscribe')}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            Subscribe — $150/mo
          </button>
          <p className="mt-3 text-xs text-gray-400">Activates instantly · Cancel anytime · Promo codes accepted</p>
        </div>
      </div>
    );
  }

  // ── Suspended ─────────────────────────────────────────────────────────────
  if (shop.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-900 p-10 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Suspended</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your shop has been suspended. Please contact support to resolve this.
          </p>
          <a href="mailto:support@loyalcup.com"
            className="inline-block px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition">
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // ── Active but setup not complete ─────────────────────────────────────────
  const squareConnected = !!shop.square_merchant_id;
  const onSetupRoute = SETUP_ROUTES.some(r => location.pathname.startsWith(r));

  if (!squareConnected && !onSetupRoute) {
    const settingsComplete = !!(shop.address && shop.phone && shop.hours);
    return <Navigate
      to={settingsComplete ? '/shop-owner/connect-square' : '/shop-owner/settings'}
      replace
    />;
  }

  // ── Fully set up ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ShopOwnerSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#181818]">
        {!squareConnected && <SetupBanner shop={shop} />}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SetupBanner({ shop }) {
  const step1Done = !!(shop.address && shop.phone);
  const step2Done = !!shop.square_merchant_id;
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-6 text-sm font-medium">
        <span className="font-bold uppercase tracking-wide text-xs opacity-80">Setup Progress</span>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className={step1Done ? 'opacity-100' : 'opacity-40'} />
          <span className={step1Done ? '' : 'opacity-60'}>Shop Settings</span>
        </div>
        <span className="opacity-40">→</span>
        <div className="flex items-center gap-2">
          <CreditCard size={16} className={step2Done ? 'opacity-100' : 'opacity-40'} />
          <span className={step2Done ? '' : 'opacity-60'}>Connect Square POS</span>
        </div>
        <span className="opacity-40">→</span>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className={step2Done ? 'opacity-100' : 'opacity-40'} />
          <span className={step2Done ? '' : 'opacity-60'}>Dashboard Unlocked</span>
        </div>
      </div>
    </div>
  );
}