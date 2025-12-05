// Workers.jsx
// Manage shop workers

export default function Workers() {
  const workers = [
    { id: 1, name: "Sarah Johnson", email: "sarah@example.com", role: "Manager", status: "Active" },
    { id: 2, name: "Mike Chen", email: "mike@example.com", role: "Barista", status: "Active" },
    { id: 3, name: "Emma Wilson", email: "emma@example.com", role: "Barista", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workers</h1>
        <button className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition">
          Invite Worker
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {workers.map((worker) => (
              <tr key={worker.id}>
                <td className="px-6 py-4">{worker.name}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{worker.email}</td>
                <td className="px-6 py-4">{worker.role}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                    {worker.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:underline text-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
