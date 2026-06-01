import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ShopOwnerSidebar from '../components/navigation/ShopOwnerSidebar';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/ui/PageLoader';
import { CheckCircle, CreditCard, Zap, AlertTriangle, Terminal } from 'lucide-react';

const SETUP_ROUTES = [
  '/shop-owner/subscribe',
  '/shop-owner/settings',
  '/shop-owner/connect-square',
];

export default function ShopOwnerLayout() {
  const { shop, loading } = useShop();
  const { user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  if (loading) return <PageLoader />;

  if (location.pathname === '/shop-owner/subscribe') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <main className="p-6 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  if (!shop) {
    const role = user?.user_metadata?.role;
    if (role === 'applicant' || role === 'shop_owner') {
      return <Navigate to="/shop-owner/subscribe" replace />;
    }
    return <Navigate to="/shop-application" replace />;
  }

  if (shop.status === 'pending_payment' || shop.status === 'pending') {
    const isAllowed = SETUP_ROUTES.some(r => location.pathname.startsWith(r));
    if (!isAllowed) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-amber-200 dark:border-amber-800 p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">One Step Away!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Subscribe to activate your shop and unlock your full dashboard.
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
              <CreditCard size={18} /> Subscribe — $200/mo
            </button>
            <p className="mt-3 text-xs text-gray-400">Activates instantly · Cancel anytime</p>
          </div>
        </div>
      );
    }
  }

  if (shop.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-red-200 dark:border-red-900 p-10 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Suspended</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your shop has been suspended. Please reach out so we can get this resolved.
          </p>
          <a
            href="mailto:support@loyalcupapp.com"
            className="inline-block px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const isPastDue       = shop.subscription_status === 'past_due';
  const squareConnected = !!shop.square_merchant_id;

  if (!squareConnected && location.pathname !== '/shop-owner/connect-square' && location.pathname !== '/shop-owner/settings') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Terminal className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Connect Square POS</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your subscription is active! Now connect Square to start accepting orders.
          </p>
          <button
            onClick={() => navigate('/shop-owner/connect-square')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Terminal size={18} /> Connect Square
          </button>
          <p className="mt-3 text-xs text-gray-400">Takes 2 minutes · Your entire menu syncs automatically</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ShopOwnerSidebar />
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#181818]">
        {isPastDue && (
          <PastDueBanner onManage={() => navigate('/shop-owner/subscribe')} />
        )}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PastDueBanner({ onManage }) {
  return (
    <div className="bg-red-600 text-white px-6 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="font-semibold">Payment past due.</span>
          <span className="opacity-90 hidden sm:inline">Update your billing to avoid losing access.</span>
        </div>
        <button
          onClick={onManage}
          className="shrink-0 bg-white text-red-600 font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-red-50 transition"
        >
          Update Billing
        </button>
      </div>
    </div>
  );
}