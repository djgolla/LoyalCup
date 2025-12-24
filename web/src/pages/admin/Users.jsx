// User management page
// List and manage all users on the platform

import { useEffect, useState, useCallback } from "react";
import { Search, MoreVertical, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("role", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      toast.success(`User role updated to ${newRole}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      shop_owner: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      shop_worker: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
      customer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    };
    const labels = {
      shop_owner: "Owner",
      shop_worker: "Worker",
      customer: "Customer",
      admin: "Admin",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[role] || ""}`}>
        {labels[role] || role}
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all users on the platform
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
          <UsersIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{users.length} Total Users</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {["all", "customer", "shop_worker", "shop_owner", "admin"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition whitespace-nowrap ${
                filter === f
                  ? "bg-amber-600 text-white font-medium"
                  : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500"
              }`}
            >
              {f === "shop_worker" ? "Worker" : f === "shop_owner" ? "Owner" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-neutral-400 mt-4">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">{user.full_name || "No name"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>

                        {activeMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-neutral-700">
                              Change Role
                            </div>
                            {["customer", "shop_worker", "shop_owner", "admin"].map((role) => (
                              user.role !== role && (
                                <button
                                  key={role}
                                  onClick={() => {
                                    handleRoleChange(user.id, role);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 text-sm capitalize"
                                >
                                  → {role.replace("_", " ")}
                                </button>
                              )
                            ))}
                            <div className="border-t border-gray-200 dark:border-neutral-700 mt-1 pt-1">
                              <button
                                onClick={() => {
                                  handleDeleteUser(user.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-red-600 dark:text-red-400 text-sm"
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
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
