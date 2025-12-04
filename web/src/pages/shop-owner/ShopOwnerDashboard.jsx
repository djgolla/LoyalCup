export default function ShopOwnerDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Orders Today
          </h3>
          <p className="text-3xl font-bold text-amber-700">42</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Revenue Today
          </h3>
          <p className="text-3xl font-bold text-green-600">$523</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Active Menu Items
          </h3>
          <p className="text-3xl font-bold text-blue-600">28</p>
        </div>
      </div>
    </div>
  );
}
