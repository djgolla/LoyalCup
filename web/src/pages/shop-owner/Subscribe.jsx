import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard, Check, Tag, ArrowRight, Sparkles,
  Coffee, Shield, Zap, AlertCircle, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '../../context/ShopContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeader() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = (await import('../../lib/supabase')).default;
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export default function Subscribe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { shop, loadShop } = useShop();

  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Handle Stripe redirect back
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (success === 'true') {
      toast.success('🎉 Subscription activated! Welcome to LoyalCup!');
      loadShop();
      // clear query params
      navigate('/shop-owner/subscribe', { replace: true });
    }
    if (cancelled === 'true') {
      toast.info('Checkout cancelled. You can subscribe anytime.');
      navigate('/shop-owner/subscribe', { replace: true });
    }
  }, [searchParams]);

  // Check subscription status
  useEffect(() => {
    if (shop?.subscription_status === 'active') {
      setSubscribed(true);
    }
  }, [shop]);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();

      const res = await fetch(`${API}/api/v1/billing/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ promo_code: promoCode.trim() || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to start checkout');
      }

      // Redirect to Stripe hosted checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      const headers = await getAuthHeader();

      const res = await fetch(`${API}/api/v1/billing/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      window.open(data.portal_url, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const features = [
    'Customer mobile app listing',
    'Full menu & order management',
    'Built-in loyalty program',
    'Square POS sync',
    'Real-time analytics dashboard',
    'Customer insights',
    'Priority support',
    'Your rate locked in forever',
  ];

  // ── Already subscribed view ──────────────────────────────────────────────────
  if (subscribed) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-neutral-900 rounded-3xl p-10 border-2 border-green-200 dark:border-green-800 shadow-xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
            You're all set! 🎉
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Your LoyalCup subscription is active. Your rate is locked in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop-owner/dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 justify-center"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="px-8 py-4 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              {portalLoading ? 'Opening...' : 'Manage Billing'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Subscribe view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
          Activate Your Subscription
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          One flat price. Everything included. Your rate locked in forever.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Features ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border-2 border-gray-100 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            What you get
          </h2>

          <ul className="space-y-3 mb-8">
            {features.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
              >
                <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                {f}
              </motion.li>
            ))}
          </ul>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Price Lock Guarantee</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
                  The rate you subscribe at today is your rate forever — even if we raise prices for new shops.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Checkout ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border-2 border-amber-200 dark:border-amber-800 shadow-xl"
        >
          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-6xl font-black text-gray-900 dark:text-white">$150</span>
              <span className="text-xl text-gray-400 mb-2">/mo</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No setup fee · Cancel anytime</p>
          </div>

          {/* Promo code */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600" />
              Promo Code (optional)
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition font-mono tracking-wider uppercase"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Discounts are applied at checkout and locked in permanently
            </p>
          </div>

          {/* Subscribe button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 15px 40px rgba(245,158,11,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-5 h-5" />
                </motion.div>
                Redirecting to checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Subscribe — $150/mo
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Shield className="w-3.5 h-3.5" />
            Secure checkout powered by Stripe. We never see your card number.
          </div>

          {/* What happens next */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              What happens next
            </p>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2"><span className="font-bold text-amber-600">1.</span> You're redirected to Stripe's secure checkout</li>
              <li className="flex gap-2"><span className="font-bold text-amber-600">2.</span> Enter your card + promo code (if you have one)</li>
              <li className="flex gap-2"><span className="font-bold text-amber-600">3.</span> Subscription activates instantly</li>
              <li className="flex gap-2"><span className="font-bold text-amber-600">4.</span> Full dashboard access unlocked 🎉</li>
            </ol>
          </div>
        </motion.div>
      </div>

      {/* Need help */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 justify-center"
      >
        <AlertCircle className="w-4 h-4" />
        Questions? <a href="/contact" className="text-amber-600 hover:underline font-medium">Contact us</a> before subscribing.
      </motion.div>
    </div>
  );
}