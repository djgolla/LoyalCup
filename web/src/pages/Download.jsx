import { motion } from "framer-motion";
import { Smartphone, Apple, Star, Coffee, Gift, Zap } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/app/loyalcup";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.loyalcup";

export default function Download() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-2xl mb-8">
            <Coffee className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
            Get the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              LoyalCup
            </span>{" "}
            App
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Order ahead, earn loyalty points, and support your favorite local coffee shops — all from your phone.
          </p>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <motion.a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl shadow-xl hover:bg-neutral-800 transition"
            >
              <Apple className="w-8 h-8" />
              <div className="text-left">
                <div className="text-xs opacity-70">Download on the</div>
                <div className="text-lg font-bold leading-tight">App Store</div>
              </div>
            </motion.a>

            <motion.a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl shadow-xl hover:bg-neutral-800 transition"
            >
              {/* Google Play logo SVG inline since lucide doesn't have it */}
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.33.19.7.24 1.06.14l11.34-11.36L12.4 9.36 3.18 23.76zm15.1-13.02L15.1 9l-3.1 3.1 3.1 3.1 3.24-1.84c.92-.52.92-1.86-.06-2.62zM2.26 1.14C2.1 1.42 2 1.74 2 2.1v19.8c0 .36.1.68.26.96L13.7 12 2.26 1.14zm9.52 9.52L3.24.54C2.88.44 2.52.5 2.2.7l11.22 11.22-1.64-1.26z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs opacity-70">Get it on</div>
                <div className="text-lg font-bold leading-tight">Google Play</div>
              </div>
            </motion.a>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loved by thousands of coffee fans
          </p>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Coffee,
              title: "Order Ahead",
              desc: "Browse menus and order from your favorite local shops before you even leave home.",
              color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
            },
            {
              icon: Gift,
              title: "Earn Rewards",
              desc: "Get loyalty points with every purchase and redeem them for free drinks.",
              color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
            },
            {
              icon: Zap,
              title: "Skip the Line",
              desc: "Your order is ready when you arrive. No waiting, no fuss.",
              color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.color} mb-4`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Shop owner CTA */}
      <div className="border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Own a coffee shop?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Join LoyalCup and reach more customers with built-in loyalty and easy ordering.
          </p>
          <a
            href="/shop-application"
            className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition shadow-lg"
          >
            Apply to Join LoyalCup
          </a>
        </div>
      </div>
    </div>
  );
}