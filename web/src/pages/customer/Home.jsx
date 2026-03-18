import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useAnimation } from 'framer-motion';
import {
  Coffee, Gift, Store, Users, TrendingUp,
  Smartphone, ArrowRight, Sparkles, Download
} from 'lucide-react';
import supabase from '../../lib/supabase';

// ─── Decorative floating coffee emoji ───────────────────────────────────────
const FloatingCoffee = ({ delay = 0, style = {} }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-20, 20, -20] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
    className="absolute text-6xl opacity-20 pointer-events-none"
    style={style}
  >
    ☕
  </motion.div>
);

// ─── Animated number counter ────────────────────────────────────────────────
const CountUpNumber = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

// ─── Stat card with shimmer skeleton ────────────────────────────────────────
const StatCard = ({ num, label, suffix, loading, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="text-center"
  >
    {loading ? (
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-24 bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse mx-auto" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-neutral-700 rounded-lg animate-pulse mx-auto" />
      </div>
    ) : (
      <>
        <motion.div
          className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2"
          whileHover={{ scale: 1.1 }}
        >
          <CountUpNumber end={num} />{suffix}
        </motion.div>
        <div className="text-gray-600 dark:text-gray-400 font-medium">{label}</div>
      </>
    )}
  </motion.div>
);

// ─── How-it-works feature card ───────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, color, delay }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) controls.start('visible');
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
      }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-neutral-800 hover:border-amber-500/50 transition-all duration-300">
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white text-center">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg text-center leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale   = useTransform(scrollY, [0, 300], [1, 0.9]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    shopCount:  0,
    orderCount: 0,
    userCount:  0,
  });

  // ── Pull live counts from Supabase ─────────────────────────────────────────
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [shopsRes, ordersRes, usersRes] = await Promise.all([
          supabase
            .from('shops')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase
            .from('orders')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          shopCount:  shopsRes.count  ?? 0,
          orderCount: ordersRes.count ?? 0,
          userCount:  usersRes.count  ?? 0,
        });
      } catch (err) {
        console.error('Failed to load home stats:', err);
        // silently fall back — stats stay at 0
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleDownloadApp = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua))   window.open('https://apps.apple.com/app/loyalcup', '_blank');
    else if (/android/.test(ua))        window.open('https://play.google.com/store/apps/details?id=com.loyalcup', '_blank');
    else                                navigate('/download');
  };

  // Build the stats row from live data
  const statsRow = [
    { num: stats.shopCount,  label: 'Local Shops',      suffix: '+' },
    { num: stats.userCount,  label: 'Happy Customers',  suffix: '+' },
    { num: stats.orderCount, label: 'Orders Placed',    suffix: '+' },
    { num: 4.8,              label: 'Average Rating',   suffix: '★' },
  ];

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-32 overflow-hidden">
        <FloatingCoffee delay={0} style={{ top: '10%',  left:  '5%' }} />
        <FloatingCoffee delay={1} style={{ top: '20%',  right: '8%' }} />
        <FloatingCoffee delay={2} style={{ bottom: '15%', left: '15%' }} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-7xl mx-auto px-4 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-8"
            >
              <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 px-8 py-4 rounded-full shadow-2xl backdrop-blur-sm border border-amber-200 dark:border-amber-900">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                  <Coffee className="w-6 h-6 text-amber-700" />
                </motion.div>
                <span className="text-sm font-bold text-gray-900 dark:text-white tracking-wide uppercase">
                  Supporting Local Coffee Shops
                </span>
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 leading-tight"
            >
              Discover Local Coffee.{' '}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 inline-block"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Stay Loyal.
              </motion.span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed"
            >
              Order ahead, earn rewards, and support your favorite local coffee shops — all in one place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(245,158,11,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadApp}
                className="group relative px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600"
                  initial={{ x: '100%' }} whileHover={{ x: 0 }} transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center justify-center gap-3">
                  <Smartphone className="w-6 h-6" />
                  Download App
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/shop-application')}
                className="px-10 py-5 bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 border-2 border-amber-700 dark:border-amber-600 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                List Your Shop
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="text-gray-600 dark:text-gray-400 text-sm"
            >
              Available on iOS and Android
            </motion.p>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
      </div>

      {/* ── Live Stats ───────────────────────────────────────────────────── */}
      <div className="py-20 bg-white dark:bg-neutral-900 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsRow.map((stat, i) => (
              <StatCard
                key={i}
                num={stat.num}
                label={stat.label}
                suffix={stat.suffix}
                loading={statsLoading && i < 3} // 4th stat (rating) is always static
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <div className="py-32 bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 px-6 py-3 rounded-full">
                <span className="text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">
                  Simple Process
                </span>
              </div>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Get your coffee fix in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              icon={Smartphone}
              title="Download the App"
              description="Get the LoyalCup app on iOS or Android and create your account in seconds"
              color="bg-gradient-to-br from-blue-500 to-cyan-500"
              delay={0.2}
            />
            <FeatureCard
              icon={Coffee}
              title="Browse & Order"
              description="Discover local shops, browse menus, and place your order ahead of time"
              color="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={0.4}
            />
            <FeatureCard
              icon={Gift}
              title="Earn Rewards"
              description="Get loyalty points with every purchase and redeem them for free drinks"
              color="bg-gradient-to-br from-purple-500 to-pink-500"
              delay={0.6}
            />
          </div>
        </div>
      </div>

      {/* ── For Shop Owners ──────────────────────────────────────────────── */}
      <div className="py-32 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-black mb-6">Grow Your Business</h2>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto">
              Join other local coffee shops already thriving on our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Users,      title: 'Reach More Customers',     desc: 'Get discovered by coffee lovers in your area and beyond' },
              { icon: Store,      title: 'Easy Menu Management',     desc: 'Update your menu in real-time with our intuitive dashboard' },
              { icon: TrendingUp, title: 'Built-in Loyalty Program', desc: 'Keep customers coming back with automatic rewards' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20 shadow-2xl"
              >
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <item.icon className="w-16 h-16 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="opacity-90 text-lg">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: '0 25px 70px rgba(0,0,0,0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/shop-application')}
              className="bg-white text-amber-700 px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
            >
              Apply to Join LoyalCup
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ── Final Download CTA ───────────────────────────────────────────── */}
      <div className="py-32 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Smartphone className="w-24 h-24 text-amber-700 mx-auto mb-8" />
            </motion.div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8"
          >
            Ready to find your new favorite coffee spot?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-gray-600 dark:text-gray-400 mb-12"
          >
            Download the app and join other coffee lovers supporting local businesses
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadApp}
            className="group relative bg-gradient-to-r from-amber-600 to-orange-600 text-white px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600"
              initial={{ x: '-100%' }} whileHover={{ x: 0 }} transition={{ duration: 0.3 }}
            />
            <span className="relative flex items-center gap-3">
              <Download className="w-6 h-6" />
              Download LoyalCup
              <ArrowRight className="w-6 h-6" />
            </span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}