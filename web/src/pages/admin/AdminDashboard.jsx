export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Platform Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Total Shops
          </h3>
          <p className="text-3xl font-bold text-amber-600">156</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-blue-600">12,453</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Orders Today
          </h3>
          <p className="text-3xl font-bold text-green-600">1,234</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Revenue Today
          </h3>
          <p className="text-3xl font-bold text-purple-600">$15,234</p>
        </div>
      </div>
    </div>
  );
}
