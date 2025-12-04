export default function ShopList() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Coffee Shops Near You
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
          >
            <h3 className="text-xl font-semibold mb-2">Coffee Shop {i}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              123 Main St, City, State
            </p>
            <a
              href={`/shops/${i}`}
              className="inline-block px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            >
              View Menu
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
