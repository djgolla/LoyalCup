export default function DashboardCard({ title, value, subtitle }) {
  return (
    <div className="p-5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 hover:shadow-md transition">
      <p className="text-gray-500 dark:text-neutral-400 text-sm">{title}</p>
      <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mt-1">
        {value}
      </h2>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
