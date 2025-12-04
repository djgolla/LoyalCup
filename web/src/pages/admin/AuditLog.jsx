// Audit log page
// View history of admin actions

import { useEffect, useState, useCallback } from "react";
import { getAuditLog } from "../../api/admin";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    entity_type: "",
    page: 1,
  });

  const loadLogs = useCallback(async () => {
    try {
      const data = await getAuditLog(filters);
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit log:", err);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getActionColor = (action) => {
    if (action.includes("delete")) return "text-red-500";
    if (action.includes("suspend")) return "text-yellow-500";
    if (action.includes("active") || action.includes("approve")) return "text-green-500";
    return "text-blue-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Audit Log</h1>
        <select
          value={filters.entity_type}
          onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-gray-300 outline-none"
        >
          <option value="">All Types</option>
          <option value="shop">Shops</option>
          <option value="user">Users</option>
          <option value="settings">Settings</option>
        </select>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50 border-b border-neutral-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Timestamp</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Admin</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Details</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-800/30 transition">
                <td className="px-6 py-4 text-gray-300 text-sm">{formatDate(log.created_at)}</td>
                <td className="px-6 py-4 text-gray-300">{log.admin_email}</td>
                <td className={`px-6 py-4 font-mono text-sm ${getActionColor(log.action)}`}>
                  {log.action}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-md text-xs bg-neutral-800 text-gray-300">
                    {log.entity_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {JSON.stringify(log.details)}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm font-mono">{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No audit log entries found
          </div>
        )}
      </div>
    </div>
  );
}
