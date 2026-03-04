import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Search, Coffee, DollarSign, 
  Eye, EyeOff, Upload, X, Check, Sparkles, Grid, 
  List, Tag, Zap
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const MenuItemCard = ({ item, onEdit, onDelete, onToggle, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ y: -8 }}
    className={`relative group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border-2 ${
      item.is_available 
        ? 'border-gray-200 dark:border-neutral-800 hover:border-amber-500' 
        : 'border-gray-300 dark:border-neutral-700 opacity-60'
    } shadow-lg hover:shadow-xl transition-all`}
  >
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggle(item)}
        className={`p-2 rounded-full shadow-lg ${
          item.is_available 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-gray-400 hover:bg-gray-500'
        }`}
      >
        {item.is_available ? (
          <Eye className="w-4 h-4 text-white" />
        ) : (
          <EyeOff className="w-4 h-4 text-white" />
        )}
      </motion.button>
    </div>

    {item.image_url ? (
      <div className="h-48 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
        <img 
          src={item.image_url} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
    ) : (
      <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
        <Coffee className="w-16 h-16 text-amber-300 dark:text-amber-700" />
      </div>
    )}

    <div className="p-5">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
        {item.name}
      </h3>
      {item.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {item.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        {item.category_name && (
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-bold">
            {item.category_name}
          </span>
        )}
        {item.sizes && item.sizes.length > 0 && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
            {item.sizes.length} sizes
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-2xl font-black text-green-600">
            {parseFloat(item.base_price || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(item)}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const MenuItemModal = ({ item, onClose, onSave, categories }) => {
  const { shopId } = useShop();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    base_price: item?.base_price || '',
    category_id: item?.category_id || '',
    image_url: item?.image_url || '',
    is_available: item?.is_available ?? true,
    sizes: item?.sizes || [],
    addons: item?.addons || [],
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [newSize, setNewSize] = useState({ name: '', price: '' });
  const [newAddon, setNewAddon] = useState({ name: '', price: '' });

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const addSize = () => {
    if (!newSize.name || !newSize.price) return;
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { ...newSize, price: parseFloat(newSize.price) }]
    });
    setNewSize({ name: '', price: '' });
  };

  const removeSize = (index) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, i) => i !== index)
    });
  };

  const addAddon = () => {
    if (!newAddon.name || !newAddon.price) return;
    setFormData({
      ...formData,
      addons: [...formData.addons, { ...newAddon, price: parseFloat(newAddon.price) }]
    });
    setNewAddon({ name: '', price: '' });
  };

  const removeAddon = (index) => {
    setFormData({
      ...formData,
      addons: formData.addons.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-3xl w-full my-8"
      >
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Item Image
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition ${
                dragActive 
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                  : 'border-gray-300 dark:border-neutral-700'
              }`}
            >
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {uploading ? 'Uploading...' : 'Drag & drop image here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold cursor-pointer hover:bg-amber-600 transition">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                placeholder="e.g., Caramel Latte"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition resize-none"
                rows="3"
                placeholder="Describe your item..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Base Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
              Size Options (Optional)
            </label>
            <div className="space-y-2 mb-3">
              {formData.sizes.map((size, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 font-semibold text-gray-900 dark:text-white">{size.name}</span>
                  <span className="text-green-600 font-bold">+${size.price.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeSize(i)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSize.name}
                onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                placeholder="Size name (e.g., Large)"
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              />
              <input
                type="number"
                step="0.01"
                value={newSize.price}
                onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                placeholder="Price"
                className="w-24 px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={addSize}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
              Add-ons / Extras (Optional)
            </label>
            <div className="space-y-2 mb-3">
              {formData.addons.map((addon, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 font-semibold text-gray-900 dark:text-white">{addon.name}</span>
                  <span className="text-green-600 font-bold">+${addon.price.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeAddon(i)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAddon.name}
                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                placeholder="Add-on name (e.g., Extra Shot)"
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              />
              <input
                type="number"
                step="0.01"
                value={newAddon.price}
                onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                placeholder="Price"
                className="w-24 px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={addAddon}
                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Available Toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
            />
            <label htmlFor="is_available" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
              Available for customers to order
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-neutral-900 pb-2">
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {item ? 'Update Item' : 'Add Item'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default function MenuBuilder() {
  const { shopId } = useShop();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (shopId) {
      loadData();
    }
  }, [shopId]);

  const loadData = async () => {
    if (!shopId) return;

    try {
      setLoading(true);

      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from('menu_categories')  // ← FIXED!
        .select('*')
        .eq('shop_id', shopId)
        .order('name');

      if (catError) {
        console.error('Categories error:', catError);
        throw catError;
      }

      // Load menu items WITHOUT join first
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Menu items error:', itemsError);
        throw itemsError;
      }

      console.log('Loaded items:', itemsData);
      console.log('Loaded categories:', categoriesData);

      // Manually map category names
      const itemsWithCategories = itemsData?.map(item => {
        const category = categoriesData?.find(cat => cat.id === item.category_id);
        return {
          ...item,
          category_name: category?.name,
          sizes: item.sizes || [],
          addons: item.addons || [],
        };
      }) || [];

      setCategories(categoriesData || []);
      setMenuItems(itemsWithCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load menu items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            description: formData.description,
            base_price: parseFloat(formData.base_price),
            category_id: formData.category_id,
            image_url: formData.image_url,
            is_available: formData.is_available,
            sizes: formData.sizes,
            addons: formData.addons,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated successfully!');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([{ 
            ...formData, 
            base_price: parseFloat(formData.base_price),
            shop_id: shopId 
          }]);

        if (error) throw error;
        toast.success('Item added successfully!');
      }

      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('Failed to save item: ' + error.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Item deleted!');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleToggle = async (item) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;
      toast.success(item.is_available ? 'Item hidden' : 'Item visible');
      loadData();
    } catch (error) {
      console.error('Failed to toggle:', error);
      toast.error('Failed to update item');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="w-12 h-12 text-amber-600" />
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
            Menu Builder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredItems.length} items
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </motion.button>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-xl transition ${
              viewMode === 'grid'
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800'
            }`}
          >
            <Grid className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-xl transition ${
              viewMode === 'list'
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800'
            }`}
          >
            <List className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <Sparkles className="w-24 h-24 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No items found' : 'No items yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? 'Try a different search' : 'Start building your menu by adding your first item'}
          </p>
          {!searchQuery && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg"
            >
              Add First Item
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }
        >
          <AnimatePresence>
            {filteredItems.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={(item) => {
                  setEditingItem(item);
                  setShowModal(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                delay={i * 0.05}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <MenuItemModal
            item={editingItem}
            categories={categories}
            onClose={() => {
              setShowModal(false);
              setEditingItem(null);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}