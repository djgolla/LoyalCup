// Activity feed widget for admin dashboard

export default function ActivityFeed({ activities }) {
  return (
    <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-800">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {activities && activities.length > 0 ? (
          activities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/50">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}
