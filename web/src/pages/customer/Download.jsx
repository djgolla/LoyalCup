import { motion } from 'framer-motion';
import { Smartphone, Apple, Download as DownloadIcon, QrCode } from 'lucide-react';

export default function Download() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Smartphone className="w-24 h-24 text-amber-700 mx-auto mb-8" />
          <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-6">
            Get the LoyalCup App
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400">
            Download on your phone to start ordering from local coffee shops
          </p>
        </motion.div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Scan with your phone
          </h2>
          
          <div className="bg-gray-100 dark:bg-neutral-800 w-64 h-64 mx-auto rounded-2xl flex items-center justify-center mb-8">
            <QrCode className="w-32 h-32 text-gray-400" />
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Scan this QR code with your phone camera to download
          </p>

          <div className="border-t border-gray-200 dark:border-neutral-700 pt-8">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Or send yourself a download link:
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-900 transition">
                <Apple className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-xl font-semibold">App Store</div>
                </div>
              </button>

              <button className="flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-900 transition">
                <DownloadIcon className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-xl font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg text-center">
            <div className="text-4xl mb-4">☕</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Browse Local Shops</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Discover amazing coffee shops near you
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Order Ahead</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Skip the line and save time
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg text-center">
            <div className="text-4xl mb-4">🎁</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Earn Rewards</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get points with every purchase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}