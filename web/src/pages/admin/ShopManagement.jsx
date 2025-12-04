export default function ShopManagement() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Shop Management
        </h1>
        <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          Add Shop
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                Shop Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr
                key={i}
                className="border-t border-slate-200 dark:border-slate-700"
              >
                <td className="px-6 py-4 text-slate-900 dark:text-white">
                  Coffee Shop {i}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  owner{i}@example.com
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-amber-600 hover:underline">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
