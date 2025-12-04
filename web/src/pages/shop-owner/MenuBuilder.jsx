export default function MenuBuilder() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Menu Builder
        </h1>
        <button className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
          Add Item
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800"
          >
            <h3 className="text-lg font-semibold mb-2">Menu Item {i}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              Category: Beverages
            </p>
            <p className="text-amber-700 font-bold mb-4">$5.99</p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm">
                Edit
              </button>
              <button className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
