import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Apple, ArrowRight, Coffee, Gift, MapPin, Play, ShoppingBag, Smartphone } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/us/app/loyalcup/id6780598444";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.loyalcup";

const appScreens = [
  { src: "/app-screens/welcome.jpg", alt: "LoyalCup welcome screen" },
  { src: "/app-screens/discover.jpg", alt: "LoyalCup coffee shop discovery screen" },
  { src: "/app-screens/shop.jpg", alt: "LoyalCup shop menu screen" },
];

function StoreButton({ href, icon: Icon, eyebrow, label }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 rounded-2xl bg-[#101827] px-6 py-4 text-white shadow-xl transition hover:bg-[#182238]"
    >
      <Icon className="h-8 w-8" />
      <span className="text-left">
        <span className="block text-xs font-semibold text-slate-300">{eyebrow}</span>
        <span className="block text-lg font-black leading-tight">{label}</span>
      </span>
    </motion.a>
  );
}

export default function Download() {
  return (
    <div className="bg-[#f6f4f0] text-slate-950">
      <section className="relative overflow-hidden bg-[#080d19]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,118,44,0.28),transparent_30%),radial-gradient(circle_at_82%_76%,rgba(43,92,184,0.32),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600">
                <Smartphone className="h-4 w-4" />
              </span>
              LoyalCup for iOS and Android
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] text-white sm:text-6xl">
              Order ahead, earn rewards, and find better coffee nearby.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300">
              LoyalCup brings local coffee shops into one clean app: discover shops, customize drinks, skip the line, and keep your rewards in one place.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <StoreButton href={APP_STORE_URL} icon={Apple} eyebrow="Download on the" label="App Store" />
              <StoreButton href={PLAY_STORE_URL} icon={Play} eyebrow="Get it on" label="Google Play" />
            </div>
          </motion.div>

          <div className="relative min-h-[620px]">
            {appScreens.map((screen, index) => (
              <motion.img
                key={screen.src}
                src={screen.src}
                alt={screen.alt}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 * index, duration: 0.55 }}
                className={[
                  "absolute h-[570px] w-[276px] rounded-[2rem] border border-white/15 object-cover p-2 shadow-2xl shadow-black/30",
                  index === 0 ? "left-0 top-8 rotate-[-6deg] bg-white/10" : "",
                  index === 1 ? "left-1/2 top-0 z-10 -translate-x-1/2 bg-white/10" : "",
                  index === 2 ? "right-0 top-12 hidden rotate-[6deg] bg-white/10 sm:block" : "",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-20 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          {
            icon: MapPin,
            title: "Discover local shops",
            body: "See nearby coffee shops, open status, shop details, and menus in one fast app.",
          },
          {
            icon: ShoppingBag,
            title: "Order ahead",
            body: "Customize drinks, pay securely, and pick up when your order is ready.",
          },
          {
            icon: Gift,
            title: "Earn rewards",
            body: "Collect points with every order and redeem rewards at participating shops.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101827] text-orange-400">
              <Coffee className="h-6 w-6" />
            </div>
            <h2 className="text-4xl font-black">Own a coffee shop?</h2>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
              Put your shop inside the LoyalCup app with Square ordering, rewards, and multi-location support.
            </p>
          </div>
          <Link
            to="/shop-application"
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 font-black text-white shadow-lg transition hover:bg-[#ff8642]"
          >
            Apply to join
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
