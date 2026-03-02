import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, UserPlus, Key, Copy,
  Users as UsersIcon, CheckCircle, XCircle, Eye, EyeOff
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const WorkerCard = ({ worker, onDelete, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {worker.full_name?.charAt(0)?.toUpperCase() || worker.email?.charAt(0)?.toUpperCase() || 'W'}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {worker.full_name || 'Worker'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{worker.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
              Worker
            </span>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(worker)}
        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition"
      >
        <Trash2 className="w-5 h-5" />
      </motion.button>
    </div>
  </motion.div>
);

const InviteModal = ({ onClose, onInvite, shopId }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onInvite({ email, name, password });
    setLoading(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    toast.success('Password copied!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Add Worker
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              placeholder="worker@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Password *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyPassword}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
              >
                <Copy className="w-5 h-5" />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generatePassword}
                className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
              >
                <Key className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              💡 Copy this password - the worker will use it to login
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">
              ⚠️ Make sure to save this password! The worker needs it to login.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Worker
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default function Workers() {
  const { shopId } = useShop();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (shopId) {
      loadWorkers();
    }
  }, [shopId]);

  const loadWorkers = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', shopId)
        .eq('role', 'shop_worker')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Loaded workers:', data);
      setWorkers(data || []);
    } catch (error) {
      console.error('Failed to load workers:', error);
      toast.error('Failed to load workers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async ({ email, name, password }) => {
    try {
      // Create auth user (without email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // No email confirmation
          data: {
            full_name: name,
            role: 'shop_worker',
            shop_id: shopId,
          }
        }
      });

      if (authError) throw authError;

      console.log('Created user:', authData);

      // Update profile with shop info
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: name,
            role: 'shop_worker',
            shop_id: shopId,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          throw profileError;
        }
      }

      toast.success(`Worker created! Email: ${email}`);
      setShowInviteModal(false);
      
      // Force reload workers
      setTimeout(() => {
        loadWorkers();
      }, 500);

    } catch (error) {
      console.error('Failed to create worker:', error);
      toast.error('Failed to create worker: ' + error.message);
    }
  };

  const handleDelete = async (worker) => {
    if (!confirm(`Remove ${worker.full_name || worker.email} from your team?`)) return;

    try {
      // Remove shop_id and set role to customer
      const { error } = await supabase
        .from('profiles')
        .update({ 
          shop_id: null,
          role: 'customer'
        })
        .eq('id', worker.id);

      if (error) throw error;

      toast.success('Worker removed!');
      
      // Force reload
      setTimeout(() => {
        loadWorkers();
      }, 200);
    } catch (error) {
      console.error('Failed to remove worker:', error);
      toast.error('Failed to remove worker: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <UsersIcon className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Workers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {workers.length} team member{workers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-5 h-5" />
          Add Worker
        </motion.button>
      </motion.div>

      {workers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <UsersIcon className="w-24 h-24 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No workers yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start building your team by adding workers
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInviteModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg"
          >
            Add First Worker
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {workers.map((worker, i) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onDelete={handleDelete}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            shopId={shopId}
            onClose={() => setShowInviteModal(false)}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>
    </div>
  );
}