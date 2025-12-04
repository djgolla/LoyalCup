export default function OrderHistory() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Order History
      </h1>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Order #{i}</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Completed
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Coffee Shop • 2 items
            </p>
            <p className="text-amber-700 font-bold">$12.50</p>
          </div>
        ))}
      </div>
    </div>
  );
}
