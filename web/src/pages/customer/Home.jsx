import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to LoyalCup
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Discover amazing local coffee shops near you
        </p>
        <Link
          to="/shops"
          className="inline-block px-8 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          Find Coffee Shops
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-xl font-semibold mb-2">☕ Local Shops</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Support your favorite local coffee shops
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-xl font-semibold mb-2">🎁 Earn Rewards</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get points and rewards with every order
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-xl font-semibold mb-2">🚀 Fast Pickup</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Order ahead and skip the line
          </p>
        </div>
      </div>
    </div>
  );
}
