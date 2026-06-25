import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Check,
  Coffee,
  Gift,
  MapPin,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
} from 'lucide-react';
import { apiUrl, parseJsonResponse } from '../../api/client';

const APP_SCREENS = {
  welcome: '/app-screens/welcome.jpg',
  discover: '/app-screens/discover.jpg',
  profile: '/app-screens/profile.jpg',
  shop: '/app-screens/shop.jpg',
  item: '/app-screens/item.jpg',
};

const Metric = ({ value, label, loading }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
    <div className="text-3xl font-black text-white">
      {loading ? '...' : value}
    </div>
    <div className="mt-1 text-sm font-medium text-slate-300">{label}</div>
  </div>
);

const ProductShot = ({ src, alt, className = '' }) => (
  <div className={`rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/30 ${className}`}>
    <img
      src={src}
      alt={alt}
      className="h-full w-full rounded-[1.55rem] object-cover"
      loading="lazy"
    />
  </div>
);

const FeatureCard = ({ icon: Icon, title, body }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-xl font-black text-slate-950">{title}</h3>
    <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ shopCount: 0, orderCount: 0, userCount: 0 });

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(apiUrl('/api/v1/shops/stats/public'));
        const data = await parseJsonResponse(response);
        setStats(data);
      } catch {
        // Keep the public page resilient if stats RPCs are unavailable.
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  const handleDownloadApp = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) window.open('https://apps.apple.com/app/loyalcup', '_blank');
    else if (/android/.test(ua)) window.open('https://play.google.com/store/apps/details?id=com.loyalcup', '_blank');
    else navigate('/download');
  };

  return (
    <div className="overflow-hidden bg-[#f6f4f0] text-slate-950">
      <section className="relative bg-[#080d19]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(244,118,44,0.30),transparent_28%),radial-gradient(circle_at_20%_84%,rgba(43,92,184,0.32),transparent_34%)]" />
        <div className="relative mx-auto grid min-h-[760px] max-w-7xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600">
                <Coffee className="h-4 w-4" />
              </span>
              Local coffee, ready fast
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              The ordering app built for neighborhood coffee shops.
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-8 text-slate-300">
              LoyalCup gives customers a polished way to discover shops, order ahead, and earn rewards, while owners keep Square as the source of truth.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownloadApp}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 text-base font-black text-white shadow-xl shadow-orange-950/30 transition hover:bg-[#ff8642]"
              >
                <Smartphone className="h-5 w-5" />
                Get the app
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop-application')}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-7 py-4 text-base font-black text-slate-950 transition hover:bg-slate-100"
              >
                List your shop
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <Metric
                value={`${(stats.shopCount || 0).toLocaleString()}+`}
                label="shops"
                loading={statsLoading}
              />
              <Metric
                value={`${(stats.userCount || 0).toLocaleString()}+`}
                label="customers"
                loading={statsLoading}
              />
              <Metric
                value={`${(stats.orderCount || 0).toLocaleString()}+`}
                label="orders"
                loading={statsLoading}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative min-h-[620px]"
          >
            <ProductShot
              src={APP_SCREENS.discover}
              alt="LoyalCup app showing nearby coffee shops"
              className="absolute left-0 top-8 h-[560px] w-[270px] rotate-[-4deg]"
            />
            <ProductShot
              src={APP_SCREENS.profile}
              alt="LoyalCup app showing loyalty rewards"
              className="absolute right-0 top-0 hidden h-[600px] w-[288px] rotate-[5deg] sm:block"
            />
            <div className="absolute bottom-10 left-12 right-6 rounded-3xl border border-white/15 bg-white/95 p-5 shadow-2xl sm:left-28">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101827] text-white">
                  <ReceiptText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Square connected</p>
                  <p className="text-lg font-black text-slate-950">Orders print at the counter.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-7 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            'Customer mobile app for discovery, ordering, and rewards',
            'Square menu sync, Square payments, Square order printing',
            '$150/mo base plan with clear multi-location pricing',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <Check className="h-5 w-5 shrink-0 text-orange-600" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">For customers</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              A coffee app that feels finished from the first tap.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The mobile experience matches the habits customers already have: search nearby, open a shop, customize an item, pay, pick up, earn points.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={MapPin}
                title="Discover local"
                body="Customers find nearby shops, see open status, browse menus, and pick the right cup for the moment."
              />
              <FeatureCard
                icon={Gift}
                title="Earn rewards"
                body="Points and rewards live in the app, so regulars have a reason to keep coming back."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={APP_SCREENS.shop} alt="LoyalCup shop menu screen" className="h-[520px] w-full rounded-3xl object-cover shadow-xl" />
            <img src={APP_SCREENS.item} alt="LoyalCup item customization screen" className="mt-12 h-[520px] w-full rounded-3xl object-cover shadow-xl" />
          </div>
        </div>
      </section>

      <section className="bg-[#101827] py-24 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-400">For shop owners</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Mobile ordering without rebuilding your operations.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              LoyalCup sits on top of the Square setup shops already use. Menus sync from Square, customer payments run through Square, and orders land where staff expect them.
            </p>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShoppingBag, title: 'Orders through Square', body: 'Paid customer orders are created in Square so your current fulfillment flow stays intact.' },
                { icon: Store, title: 'Location aware', body: 'Each location can keep its own menu, Square connection, dashboard, and orders.' },
                { icon: BarChart3, title: 'Owner dashboard', body: 'Track sales, menu activity, orders, customers, loyalty, and location performance.' },
                { icon: ShieldCheck, title: 'Clean billing', body: '$150/mo for the first location, then $50/mo for each additional location.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <Icon className="h-6 w-6 text-orange-400" />
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Today</p>
                  <h3 className="text-2xl font-black">Roast House Downtown</h3>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">Live</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['42', 'orders'],
                  ['$368', 'revenue'],
                  ['18', 'reward signups'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-2xl font-black">{value}</div>
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ['Iced Latte', 'Ready in 8 min', '$5.50'],
                  ['Cold Brew', 'Ready in 6 min', '$4.75'],
                  ['Honey Cappuccino', 'Ready in 10 min', '$6.25'],
                ].map(([name, status, price]) => (
                  <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-black">{name}</p>
                      <p className="text-sm text-slate-500">{status}</p>
                    </div>
                    <p className="font-black text-orange-600">{price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm sm:p-12 lg:p-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Go live fast</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Built to make the owner conversation easier.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                When a shop asks “Does this work with my locations and Square setup?” the answer is yes, without dragging them into a complicated technical explanation.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                ['1', 'Apply with one or multiple locations'],
                ['2', 'Subscribe once with location-based billing'],
                ['3', 'Connect each shop to the correct Square location'],
                ['4', 'Import menus and start taking mobile orders'],
              ].map(([number, label]) => (
                <div key={number} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#f8f6f2] p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#101827] text-lg font-black text-white">
                    {number}
                  </div>
                  <p className="text-lg font-black text-slate-900">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Ready when you are</p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">Launch your shop on LoyalCup.</h2>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Start with one location or bring the whole group. The customer experience stays clean either way.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/shop-application')}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 font-black text-white shadow-lg transition hover:bg-[#ff8642]"
            >
              List your shop
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-7 py-4 font-black text-slate-950 transition hover:bg-slate-50"
            >
              See pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
