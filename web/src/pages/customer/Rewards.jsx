export default function Rewards() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Loyalty Rewards
      </h1>
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800 mb-6">
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Total Points</p>
          <p className="text-5xl font-bold text-amber-700">250</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
            >
              <h3 className="font-semibold mb-1">Reward {i}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {i * 50} points required
              </p>
              <button className="w-full px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
                Redeem
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
