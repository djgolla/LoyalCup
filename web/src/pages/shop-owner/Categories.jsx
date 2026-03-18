import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, FolderOpen, X, Check, Sparkles
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const CategoryCard = ({ category, onEdit, onDelete, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
        <FolderOpen className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
        )}
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(category)}
          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          <Edit2 className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(category)}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              placeholder="e.g., Coffee"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition resize-none"
              rows="3"
              placeholder="Optional description..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <motion.button
              type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {category ? 'Update' : 'Add'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default function Categories() {
  const { shopId } = useShop();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (shopId) loadCategories();
  }, [shopId]);

  const loadCategories = async () => {
    if (!shopId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopId)
        // no is_active filter — old rows have NULL which gets excluded by eq()
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast.error('Failed to load categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name: formData.name, description: formData.description || null })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            shop_id: shopId,
            display_order: categories.length,
            is_active: true,
          }]);
        if (error) throw error;
        toast.success('Category added!');
      }
      setShowModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Delete "${category.name}"? Menu items in this category won't be deleted.`)) return;
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', category.id);
      if (error) throw error;
      toast.success('Category deleted!');
      loadCategories();
    } catch (err) {
      console.error('Failed to delete:', err);
      toast.error('Failed to delete: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <FolderOpen className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · organize your menu items
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingCategory(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-5 h-5" /> Add Category
        </motion.button>
      </motion.div>

      {categories.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
          <Sparkles className="w-24 h-24 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No categories yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create categories to organize your menu items</p>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg"
          >
            Add First Category
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {categories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={(cat) => { setEditingCategory(cat); setShowModal(true); }}
                onDelete={handleDelete}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => { setShowModal(false); setEditingCategory(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}