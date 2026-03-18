import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  Check, Coffee, Smartphone, BarChart3, Award,
  Menu, RefreshCw, ShoppingBag, Users, Headphones,
  ArrowRight, Sparkles, Tag, Shield, Zap
} from 'lucide-react';

const FloatingCoffee = ({ delay = 0, style = {} }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-20, 20, -20] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute text-5xl opacity-10 pointer-events-none select-none"
    style={style}
  >
    ☕
  </motion.div>
);

const FeatureRow = ({ icon: Icon, title, desc, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();
  useEffect(() => { if (isInView) controls.start('visible'); }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay } },
      }}
      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-md">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
};

const FAQ = ({ q, a, delay }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm"
    >
      <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{q}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
    </motion.div>
  );
};

export default function Pricing() {
  const navigate = useNavigate();

  const features = [
    { icon: Smartphone,  title: 'Customer Mobile App Listing',    desc: 'Your shop is discoverable by thousands of coffee lovers on iOS & Android' },
    { icon: Menu,        title: 'Full Menu Management',           desc: 'Build and update your menu in real-time — items, categories, modifiers, pricing' },
    { icon: ShoppingBag, title: 'Online & Mobile Ordering',       desc: 'Accept orders ahead of time directly through the LoyalCup app' },
    { icon: Award,       title: 'Built-in Loyalty Program',       desc: 'Automatic points, rewards, and punch cards to keep customers coming back' },
    { icon: RefreshCw,   title: 'Square POS Sync',                desc: 'Two-way sync with your existing Square setup — no double entry' },
    { icon: BarChart3,   title: 'Analytics Dashboard',            desc: 'Track orders, revenue, popular items, and customer trends in real time' },
    { icon: Users,       title: 'Customer Insights',              desc: 'See who your regulars are, their order history, and lifetime spend' },
    { icon: Headphones,  title: 'Priority Support',               desc: 'Direct access to our team — real people, fast responses, no bots' },
    { icon: Shield,      title: 'Secure Payments',                desc: 'PCI-compliant payment processing via Stripe. You never touch card data.' },
    { icon: Zap,         title: 'Instant Setup',                  desc: 'Go live in under 30 minutes — no dev skills required' },
  ];

  const faqs = [
    {
      q: 'Is there a contract or commitment?',
      a: 'No contracts, no setup fees. Month-to-month — cancel anytime from your dashboard. We keep you because the product is worth it, not because you\'re locked in.',
    },
    {
      q: 'Do I need Square to use LoyalCup?',
      a: 'Yes — Square POS is required for the initial launch. We\'re working on support for other POS systems and will let you know when more options are available.',
    },
    {
      q: 'What happens to my price if you raise it later?',
      a: 'Your rate is locked in from the day you join. If we raise prices for new shops, you keep your current rate forever. Loyalty works both ways.',
    },
    {
      q: 'How does the promo code work?',
      a: 'If you have a promo code, enter it at checkout when you subscribe. Discounts are applied immediately and locked in for the duration specified in the code.',
    },
    {
      q: 'What are the payment processing fees for customer orders?',
      a: 'Standard Stripe fees apply to customer orders (2.9% + 30¢ per transaction). These are separate from the $150/mo platform fee and are industry standard.',
    },
    {
      q: 'How do I get approved?',
      a: 'Submit your shop application and our team reviews it within 24–48 hours. Once approved, you\'ll get an email with next steps to get set up and go live.',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-32 overflow-hidden">
        <FloatingCoffee delay={0} style={{ top: '10%',  left:  '5%'  }} />
        <FloatingCoffee delay={1} style={{ top: '20%',  right: '8%'  }} />
        <FloatingCoffee delay={2} style={{ bottom: '15%', left: '15%' }} />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 px-6 py-3 rounded-full shadow-xl border border-amber-200 dark:border-amber-900 mb-8"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <Coffee className="w-5 h-5 text-amber-700" />
            </motion.div>
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Simple, Transparent Pricing
            </span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl lg:text-8xl font-black text-gray-900 dark:text-white mb-6 leading-tight"
          >
            One price.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
              Everything included.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto font-light"
          >
            No tiers. No hidden fees. No "you need to upgrade for that."
            Everything LoyalCup offers, at one flat monthly rate.
          </motion.p>

          {/* ── Pricing Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-lg mx-auto"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-3xl blur-2xl" />

            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-10 shadow-2xl border-2 border-amber-200 dark:border-amber-800">
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg whitespace-nowrap">
                  🔒 Your rate is locked in forever
                </span>
              </div>

              <div className="text-center mb-8 mt-2">
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-7xl font-black text-gray-900 dark:text-white">$150</span>
                  <span className="text-2xl text-gray-500 dark:text-gray-400 mb-3">/mo</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">per shop · cancel anytime</p>
              </div>

              {/* Quick feature list */}
              <ul className="space-y-3 mb-8">
                {[
                  'Customer mobile app listing',
                  'Full menu & order management',
                  'Built-in loyalty program',
                  'Square POS sync',
                  'Analytics dashboard',
                  'Priority support',
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.07 }}
                    className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>

              {/* Promo code hint */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-6 text-sm text-amber-700 dark:text-amber-400">
                <Tag className="w-4 h-4 shrink-0" />
                <span>Have a promo code? Enter it at checkout to lock in a discounted rate.</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 20px 60px rgba(245,158,11,0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/shop-application')}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 group"
              >
                Apply to Join LoyalCup
                <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>

              <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                Applications reviewed within 24–48 hours
              </p>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
      </div>

      {/* ── Everything Included ── */}
      <div className="py-32 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 px-6 py-3 rounded-full">
                <span className="text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">
                  What's Included
                </span>
              </div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4">
              Everything you need to run your shop
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              No add-ons. No tiers. Every feature, every update, every improvement — included.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {features.map((f, i) => (
              <FeatureRow key={i} {...f} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Price Lock Banner ── */}
      <div className="py-20 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">
              Your rate is locked in. Forever.
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-4">
              When you join LoyalCup, the price you sign up at is the price you pay — always.
              Even if we raise our rates for new shops, you're protected.
            </p>
            <p className="text-lg opacity-75">
              Early shops get the best deal. The longer you wait, the more you might pay.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="py-32 bg-gray-50 dark:bg-neutral-800">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 px-6 py-3 rounded-full">
                <span className="text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">
                  FAQ
                </span>
              </div>
            </div>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white">
              Questions? Answered.
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQ key={i} {...faq} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="py-32 bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Coffee className="w-20 h-20 text-amber-600 mx-auto mb-8" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6"
          >
            Ready to grow your shop?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Join LoyalCup today and lock in your rate at $150/month forever.
            Setup takes under 30 minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(245,158,11,0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop-application')}
              className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full text-xl font-bold shadow-2xl flex items-center gap-3 justify-center"
            >
              Apply Now — It's Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/contact')}
              className="px-10 py-5 bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 border-2 border-amber-600 rounded-full text-xl font-bold shadow-xl"
            >
              Talk to Us First
            </motion.button>
          </motion.div>

          <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
            No credit card required to apply. Pay only after you're approved and set up.
          </p>
        </div>
      </div>

    </div>
  );
}