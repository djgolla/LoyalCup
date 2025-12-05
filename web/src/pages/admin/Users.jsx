// User management page
// List and manage all users on the platform

import { useEffect, useState, useCallback } from "react";
import { Search, MoreVertical } from "lucide-react";
import { listUsers, updateUserRole, updateUserStatus, deleteUser } from "../../api/admin";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const filters = filter !== "all" ? { role: filter } : {};
      const data = await listUsers(filters);
      setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    }
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      toast.success(`User ${newStatus === "suspended" ? "suspended" : "activated"}`);
      loadUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      loadUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      shop_owner: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      shop_worker: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      customer: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    const labels = {
      shop_owner: "Owner",
      shop_worker: "Worker",
      customer: "Customer",
      admin: "Admin",
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs border ${styles[role] || ""}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      suspended: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs border ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-gray-300 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2">
          {["all", "customer", "shop_worker", "shop_owner", "admin"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                filter === f
                  ? "bg-amber-500 text-black font-medium"
                  : "bg-neutral-900 text-gray-300 border border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {f === "shop_worker" ? "Worker" : f === "shop_owner" ? "Owner" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-800/50 border-b border-neutral-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">User</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Joined</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-800/30 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                    <p className="text-white font-medium">{user.full_name || "No name"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{user.email}</td>
                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                <td className="px-6 py-4 text-gray-300">{user.created_at}</td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-2 hover:bg-neutral-800 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>

                    {activeMenu === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-10">
                        <div className="px-4 py-2 text-xs text-gray-500 border-b border-neutral-700">Change Role</div>
                        {["customer", "shop_worker", "shop_owner", "admin"].map((role) => (
                          user.role !== role && (
                            <button
                              key={role}
                              onClick={() => {
                                handleRoleChange(user.id, role);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-gray-300 text-sm capitalize"
                            >
                              → {role.replace("_", " ")}
                            </button>
                          )
                        ))}
                        <div className="border-t border-neutral-700 mt-1 pt-1">
                          {user.status === "active" ? (
                            <button
                              onClick={() => {
                                handleStatusChange(user.id, "suspended");
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-yellow-500 text-sm"
                            >
                              Suspend User
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleStatusChange(user.id, "active");
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-green-500 text-sm"
                            >
                              Activate User
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDeleteUser(user.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-red-400 text-sm"
                          >
                            Delete User
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
