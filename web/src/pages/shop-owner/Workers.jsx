// Workers.jsx
// Manage shop workers

import { useEffect, useState } from "react";
import { toast } from "sonner";
import supabase from "../../lib/supabase";
import { useShop } from "../../context/ShopContext";
import Loading from "../../components/Loading";
import Modal from "../../components/Modal";

export default function Workers() {
  const { shopId } = useShop();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (shopId) {
      loadWorkers();
    }
  }, [shopId]);

  const loadWorkers = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Get all users who are workers for this shop
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', shopId)
        .eq('role', 'worker')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWorkers(data || []);
    } catch (error) {
      console.error("Failed to load workers:", error);
      toast.error("Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteWorker = async (e) => {
    e.preventDefault();
    if (!shopId || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, role, shop_id')
        .eq('email', inviteEmail.trim())
        .single();

      if (!existingUser) {
        toast.error("No user found with this email. They need to sign up first.");
        return;
      }

      if (existingUser.role === 'worker' && existingUser.shop_id) {
        toast.error("This user is already assigned to a shop");
        return;
      }

      // Update user to be a worker for this shop
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'worker',
          shop_id: shopId
        })
        .eq('id', existingUser.id);

      if (error) throw error;

      toast.success("Worker invited successfully!");
      setInviteEmail("");
      setInviteModalOpen(false);
      loadWorkers();
    } catch (error) {
      console.error("Failed to invite worker:", error);
      toast.error("Failed to invite worker");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveWorker = async (workerId) => {
    if (!confirm("Are you sure you want to remove this worker?")) return;

    try {
      // Remove shop assignment and change role back to customer
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: 'customer',
          shop_id: null
        })
        .eq('id', workerId);

      if (error) throw error;

      toast.success("Worker removed successfully");
      loadWorkers();
    } catch (error) {
      console.error("Failed to remove worker:", error);
      toast.error("Failed to remove worker");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Workers</h1>
        <button 
          onClick={() => setInviteModalOpen(true)}
          className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          Invite Worker
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No workers yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Invite your team members to help manage orders
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {worker.full_name || 'No name set'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {worker.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleRemoveWorker(worker.id)}
                      className="text-red-600 dark:text-red-400 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Worker"
      >
        <form onSubmit={handleInviteWorker} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Worker Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="worker@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The user must have an existing account to be invited
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition disabled:opacity-50"
            >
              {inviting ? "Inviting..." : "Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
