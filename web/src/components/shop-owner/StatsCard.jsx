// StatsCard.jsx
// Analytics stat card for shop owner dashboard

export default function StatsCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Icon className="text-amber-700 dark:text-amber-500" size={24} />
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
      )}
      {trend && (
        <p className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}
