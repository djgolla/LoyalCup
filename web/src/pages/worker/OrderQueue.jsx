export default function OrderQueue() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Active Orders
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Order #{i}</h3>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Pending
              </span>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Latte x2
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Cappuccino x1
              </p>
            </div>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Mark Ready
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
