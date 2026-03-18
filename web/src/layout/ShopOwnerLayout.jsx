import { Outlet, Navigate, useLocation } from 'react-router-dom';
import ShopOwnerSidebar from '../components/navigation/ShopOwnerSidebar';
import { useShop } from '../context/ShopContext';
import PageLoader from '../components/ui/PageLoader';
import { Clock, CheckCircle, CreditCard } from 'lucide-react';

// Routes accessible before setup is complete
const SETUP_ROUTES = [
  '/shop-owner/settings',
  '/shop-owner/connect-square',
];

export default function ShopOwnerLayout() {
  const { shop, loading } = useShop();
  const location = useLocation();

  if (loading) return <PageLoader />;

  // ── Still pending approval ────────────────────────────────────────────────
  if (!shop || shop.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-10 text-center">
          <div className="relative inline-block mb-6">
            <Clock className="w-20 h-20 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Application Under Review
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your shop application is being reviewed by our team. You'll receive an email
            as soon as it's approved — usually within 24–48 hours.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left text-sm text-amber-800 dark:text-amber-300 space-y-2 mb-6">
            <p>✅ Application received</p>
            <p>⏳ Under review by LoyalCup team</p>
            <p className="opacity-50">📧 Approval email sent to you</p>
            <p className="opacity-50">🚀 Dashboard access unlocked</p>
          </div>
          <a href="mailto:support@loyalcup.com"
            className="text-sm text-amber-600 hover:underline">
            Questions? Email support@loyalcup.com
          </a>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Account Suspended
          </h1>
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
  // Setup is "complete" when Square is connected (square_merchant_id is set)
  const squareConnected = !!shop.square_merchant_id;
  const onSetupRoute = SETUP_ROUTES.some(r => location.pathname.startsWith(r));

  if (!squareConnected && !onSetupRoute) {
    // Determine where they are in setup:
    // Step 1 — fill out shop settings (name, address, hours, images)
    // Step 2 — connect Square POS
    const settingsComplete = !!(shop.address && shop.phone && shop.hours);

    return <Navigate
      to={settingsComplete ? '/shop-owner/connect-square' : '/shop-owner/settings'}
      replace
    />;
  }

  // ── Fully set up — show full portal ──────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ShopOwnerSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#181818]">
        {/* Setup progress banner — shown until Square is connected */}
        {!squareConnected && (
          <SetupBanner shop={shop} currentPath={location.pathname} />
        )}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SetupBanner({ shop, currentPath }) {
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