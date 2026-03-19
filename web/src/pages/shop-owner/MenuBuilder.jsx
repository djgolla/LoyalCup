import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Search, Coffee, DollarSign,
  Eye, EyeOff, Upload, X, Check, Sparkles, Grid,
  List, Layers, Zap, Package, AlertTriangle
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

// ─── Grid Card ────────────────────────────────────────────────────────────────
const MenuItemGridCard = ({ item, onEdit, onDelete, onToggle, onToggleStock, delay }) => {
  const attachedCount = (item.modifier_group_ids || []).length;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.28, delay }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className={`relative group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border-2 transition-all shadow-md hover:shadow-xl ${
        item.is_available && !item.is_out_of_stock
          ? 'border-gray-200 dark:border-neutral-800 hover:border-amber-400'
          : 'border-gray-200 dark:border-neutral-800 opacity-60 hover:border-gray-300'
      }`}
    >
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {item.is_out_of_stock && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow">
            Out of Stock
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
          onClick={() => onToggle(item)}
          title={item.is_available ? 'Hide from customers' : 'Show to customers'}
          className={`p-1.5 rounded-full shadow-lg backdrop-blur-sm transition ${
            item.is_available ? 'bg-green-500/90 hover:bg-green-600' : 'bg-gray-500/80 hover:bg-gray-600'
          }`}
        >
          {item.is_available ? <Eye className="w-3 h-3 text-white" /> : <EyeOff className="w-3 h-3 text-white" />}
        </motion.button>
      </div>

      {item.image_url ? (
        <div className="h-40 overflow-hidden bg-gray-100 dark:bg-neutral-800">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
          <Coffee className="w-12 h-12 text-amber-300 dark:text-amber-700" />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1 text-base">{item.name}</h3>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.category_name && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/25 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold">{item.category_name}</span>
          )}
          {item.pos_source && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/25 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{item.pos_source}
            </span>
          )}
          {attachedCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/25 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-0.5">
              <Layers className="w-2.5 h-2.5" />{attachedCount} mod{attachedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-black text-green-600">${parseFloat(item.base_price || 0).toFixed(2)}</span>
          <div className="flex gap-1.5">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => onToggleStock(item)}
              title={item.is_out_of_stock ? 'Mark in stock' : 'Mark out of stock'}
              className={`p-1.5 rounded-xl transition text-xs font-bold ${item.is_out_of_stock ? 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => onEdit(item)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </motion.button>
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => onDelete(item)}
              className="p-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── List Row ─────────────────────────────────────────────────────────────────
const MenuItemListRow = ({ item, onEdit, onDelete, onToggle, onToggleStock, delay }) => {
  const attachedCount = (item.modifier_group_ids || []).length;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22, delay }}
      className={`flex items-center gap-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 p-3 shadow-sm hover:shadow-md transition-all ${
        item.is_available && !item.is_out_of_stock
          ? 'border-gray-200 dark:border-neutral-800 hover:border-amber-400'
          : 'border-gray-200 dark:border-neutral-800 opacity-60'
      }`}
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-neutral-800">
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
              <Coffee className="w-7 h-7 text-amber-300 dark:text-amber-700" />
            </div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</span>
          {item.is_out_of_stock && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold">Out of Stock</span>
          )}
          {item.category_name && (
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/25 text-purple-700 rounded-lg text-xs font-semibold">{item.category_name}</span>
          )}
          {item.pos_source && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{item.pos_source}
            </span>
          )}
          {attachedCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/25 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-0.5">
              <Layers className="w-2.5 h-2.5" />{attachedCount} mod{attachedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {item.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>}
      </div>

      <span className="text-xl font-black text-green-600 shrink-0">${parseFloat(item.base_price || 0).toFixed(2)}</span>

      <div className="flex items-center gap-1.5 shrink-0">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onToggleStock(item)}
          title={item.is_out_of_stock ? 'Mark in stock' : 'Mark out of stock'}
          className={`p-2 rounded-xl transition ${item.is_out_of_stock ? 'bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:bg-orange-100 hover:text-orange-500'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(item)}
          className={`p-2 rounded-xl transition ${item.is_available ? 'bg-green-100 dark:bg-green-900/20 text-green-600 hover:bg-green-500 hover:text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:bg-gray-500 hover:text-white'}`}
        >
          {item.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(item)}
          className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(item)}
          className="p-2 bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
const MenuItemModal = ({ item, onClose, onSave, categories, modifierGroups }) => {
  const { shopId } = useShop();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    base_price: item?.base_price ?? '',
    category_id: item?.category_id || '',
    image_url: item?.image_url || '',
    is_available: item?.is_available ?? true,
    is_out_of_stock: item?.is_out_of_stock ?? false,
    modifier_group_ids: item?.modifier_group_ids || [],
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => setExpandedGroups(s => ({ ...s, [groupId]: !s[groupId] }));

  const toggleModifierGroup = (groupId) => {
    setFormData(fd => {
      const ids = fd.modifier_group_ids || [];
      return { ...fd, modifier_group_ids: ids.includes(groupId) ? ids.filter(id => id !== groupId) : [...ids, groupId] };
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('shop-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(fileName);
      setFormData(fd => ({ ...fd, image_url: publicUrl }));
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]); };

  const attachedGroups = modifierGroups.filter(g => (formData.modifier_group_ids || []).includes(g.id));
  const unattachedGroups = modifierGroups.filter(g => !(formData.modifier_group_ids || []).includes(g.id));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="border-b border-gray-200 dark:border-neutral-800 p-6 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{item ? 'Edit Item' : 'Add Item'}</h2>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition">
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Item Image</label>
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl overflow-hidden transition ${dragActive ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-300 dark:border-neutral-700'}`}>
              {formData.image_url ? (
                <div className="relative">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                  </div>
                  <button type="button" onClick={() => setFormData(fd => ({ ...fd, image_url: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-2">{uploading ? 'Uploading...' : 'Drag & drop or'}</p>
                  <label className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-amber-600 transition">
                    Choose File
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0])} className="hidden" disabled={uploading} />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Item Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData(fd => ({ ...fd, name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                placeholder="e.g. Caramel Latte" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea value={formData.description} onChange={e => setFormData(fd => ({ ...fd, description: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition resize-none"
                rows="2" placeholder="Describe your item..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Base Price *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" step="0.01" min="0" value={formData.base_price}
                  onChange={e => setFormData(fd => ({ ...fd, base_price: e.target.value }))}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition"
                  placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select value={formData.category_id} onChange={e => setFormData(fd => ({ ...fd, category_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition">
                <option value="">No category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Modifier Groups
              </label>
              <span className="text-xs text-gray-400">{formData.modifier_group_ids?.length || 0} attached</span>
            </div>
            {modifierGroups.length === 0 ? (
              <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl">
                <p className="text-sm text-gray-500">No modifier groups yet.</p>
                <p className="text-xs text-gray-400 mt-0.5">Create them on the <strong>Modifiers</strong> page.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {attachedGroups.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 px-1 pb-0.5">Attached</p>
                )}
                {attachedGroups.map(group => (
                  <ModGroupRow key={group.id} group={group} isAttached expanded={expandedGroups[group.id]} onToggleAttach={() => toggleModifierGroup(group.id)} onExpand={() => toggleGroup(group.id)} />
                ))}
                {unattachedGroups.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 pb-0.5 pt-1">Available</p>
                )}
                {unattachedGroups.map(group => (
                  <ModGroupRow key={group.id} group={group} isAttached={false} expanded={expandedGroups[group.id]} onToggleAttach={() => toggleModifierGroup(group.id)} onExpand={() => toggleGroup(group.id)} />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition ${formData.is_available ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800'}`}
              onClick={() => setFormData(fd => ({ ...fd, is_available: !fd.is_available }))}>
              <div className={`w-9 h-5 rounded-full transition-colors shrink-0 ${formData.is_available ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 mt-0.5 transition-transform ${formData.is_available ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{formData.is_available ? 'Visible' : 'Hidden'}</p>
                <p className="text-[10px] text-gray-500">Show to customers</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition ${formData.is_out_of_stock ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800'}`}
              onClick={() => setFormData(fd => ({ ...fd, is_out_of_stock: !fd.is_out_of_stock }))}>
              <div className={`w-9 h-5 rounded-full transition-colors shrink-0 ${formData.is_out_of_stock ? 'bg-orange-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 mt-0.5 transition-transform ${formData.is_out_of_stock ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{formData.is_out_of_stock ? 'Out of Stock' : 'In Stock'}</p>
                <p className="text-[10px] text-gray-500">Temp unavailable</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-800 p-4 flex gap-3 shrink-0">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition">
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => onSave(formData)}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {item ? 'Save Changes' : 'Add Item'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Modifier Group Row ───────────────────────────────────────────────────────
const ModGroupRow = ({ group, isAttached, expanded, onToggleAttach, onExpand }) => (
  <div className={`rounded-xl border-2 overflow-hidden transition ${isAttached ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-200 dark:border-neutral-700'}`}>
    <div className="flex items-center gap-3 p-2.5 cursor-pointer" onClick={onToggleAttach}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${isAttached ? 'bg-amber-500 border-amber-500' : 'border-gray-300 dark:border-neutral-600'}`}>
        {isAttached && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{group.name}</span>
          {group.pos_source && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />{group.pos_source}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {group.max_selections === 1 ? 'Pick one' : 'Pick many'} · {group.min_selections > 0 ? 'Required' : 'Optional'} · {group.options?.length || 0} options
        </span>
      </div>
      <button type="button" onClick={e => { e.stopPropagation(); onExpand(); }}
        className="p-1 text-gray-400 hover:text-gray-600 transition shrink-0">
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.div>
      </button>
    </div>
    <AnimatePresence>
      {expanded && group.options?.length > 0 && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
          <div className="px-3 pb-2.5 space-y-1">
            {group.options.map(opt => (
              <div key={opt.id} className="flex justify-between text-xs py-1 px-2 bg-white dark:bg-neutral-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">{opt.name}</span>
                <span className="font-semibold text-green-600">{opt.price_adjustment > 0 ? `+$${parseFloat(opt.price_adjustment).toFixed(2)}` : 'Free'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MenuBuilder() {
  const { shopId } = useShop();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [catRes, itemRes, groupRes, optRes] = await Promise.all([
        // ← 'categories' — the actual table name, with display_order sort
        supabase.from('categories').select('*').eq('shop_id', shopId).order('display_order', { ascending: true }),
        supabase.from('menu_items').select('*').eq('shop_id', shopId).eq('is_active', true).order('display_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('modifier_groups').select('*').eq('shop_id', shopId).eq('is_active', true),
        supabase.from('modifier_options').select('*').eq('shop_id', shopId).eq('is_active', true),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      const cats = catRes.data || [];
      const opts = optRes.data || [];
      const groups = (groupRes.data || []).map(g => ({ ...g, options: opts.filter(o => o.modifier_group_id === g.id) }));
      const items = (itemRes.data || []).map(item => ({
        ...item,
        category_name: cats.find(c => c.id === item.category_id)?.name,
        modifier_group_ids: item.modifier_group_ids || [],
      }));

      setCategories(cats);
      setModifierGroups(groups);
      setMenuItems(items);
    } catch (err) {
      toast.error('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { if (shopId) loadData(); }, [shopId, loadData]);

  const handleSave = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        base_price: parseFloat(formData.base_price) || 0,
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        is_available: formData.is_available,
        is_out_of_stock: formData.is_out_of_stock,
        modifier_group_ids: formData.modifier_group_ids || [],
      };
      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item updated!');
      } else {
        const { error } = await supabase.from('menu_items').insert([{ ...payload, shop_id: shopId, is_active: true }]);
        if (error) throw error;
        toast.success('Item added!');
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error('Save failed: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      const { error } = await supabase.from('menu_items').update({ is_active: false }).eq('id', item.id);
      if (error) throw error;
      toast.success('Item deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleToggle = async (item) => {
    try {
      const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
      if (error) throw error;
      toast.success(item.is_available ? 'Item hidden' : 'Item now visible');
      loadData();
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const handleToggleStock = async (item) => {
    try {
      const { error } = await supabase.from('menu_items').update({ is_out_of_stock: !item.is_out_of_stock }).eq('id', item.id);
      if (error) throw error;
      toast.success(item.is_out_of_stock ? 'Marked in stock' : 'Marked out of stock');
      loadData();
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableItems   = filteredItems.filter(i => i.is_available && !i.is_out_of_stock);
  const outOfStockItems  = filteredItems.filter(i => i.is_out_of_stock);
  const hiddenItems      = filteredItems.filter(i => !i.is_available && !i.is_out_of_stock);
  const totalItems       = menuItems.length;
  const availableCount   = menuItems.filter(i => i.is_available && !i.is_out_of_stock).length;
  const outOfStockCount  = menuItems.filter(i => i.is_out_of_stock).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Coffee className="w-12 h-12 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  const renderItems = (items, startDelay = 0) => items.map((item, i) =>
    viewMode === 'grid' ? (
      <MenuItemGridCard key={item.id} item={item}
        onEdit={it => { setEditingItem(it); setShowModal(true); }}
        onDelete={handleDelete} onToggle={handleToggle} onToggleStock={handleToggleStock}
        delay={startDelay + i * 0.03} />
    ) : (
      <MenuItemListRow key={item.id} item={item}
        onEdit={it => { setEditingItem(it); setShowModal(true); }}
        onDelete={handleDelete} onToggle={handleToggle} onToggleStock={handleToggleStock}
        delay={startDelay + i * 0.02} />
    )
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Menu Builder</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {totalItems} items · {availableCount} available{outOfStockCount > 0 ? ` · ${outOfStockCount} out of stock` : ''} · {modifierGroups.length} modifier group{modifierGroups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingItem(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
          <Plus className="w-5 h-5" /> Add Item
        </motion.button>
      </motion.div>

      {totalItems > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-4 gap-3">
          {[
            { icon: Package,       label: 'Total Items',     value: totalItems,         color: 'from-blue-500 to-blue-600' },
            { icon: Eye,           label: 'Available',       value: availableCount,     color: 'from-green-500 to-green-600' },
            { icon: AlertTriangle, label: 'Out of Stock',    value: outOfStockCount,    color: 'from-orange-400 to-orange-500' },
            { icon: Layers,        label: 'Modifier Groups', value: modifierGroups.length, color: 'from-amber-500 to-orange-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border-2 border-gray-200 dark:border-neutral-800 flex items-center gap-3 shadow-sm">
              <div className={`p-2.5 bg-gradient-to-br ${color} rounded-xl shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-amber-500 transition" />
          </div>
          <div className="flex gap-2">
            {['grid', 'list'].map(mode => (
              <motion.button key={mode} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(mode)}
                className={`p-3 rounded-xl transition ${viewMode === mode ? 'bg-amber-500 text-white shadow-md' : 'bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-800 text-gray-500'}`}>
                {mode === 'grid' ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </motion.button>
            ))}
          </div>
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border-2 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:border-amber-400'
                }`}>
                {cat.name}
                {cat.id !== 'all' && <span className="ml-1.5 opacity-60 text-xs">{menuItems.filter(i => i.category_id === cat.id).length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
          <Sparkles className="w-20 h-20 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{searchQuery ? 'No items found' : 'No items yet'}</h3>
          <p className="text-gray-500 mb-6">{searchQuery ? `No results for "${searchQuery}"` : 'Add your first item or connect your POS to import'}</p>
          {!searchQuery && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg">
              Add First Item
            </motion.button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {availableItems.length > 0 && (
            <div>
              {(outOfStockItems.length > 0 || hiddenItems.length > 0) && (
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-green-500" />
                  <h2 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Available · {availableItems.length}</h2>
                </div>
              )}
              <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                <AnimatePresence>{renderItems(availableItems)}</AnimatePresence>
              </motion.div>
            </div>
          )}
          {outOfStockItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Out of Stock · {outOfStockItems.length}</h2>
              </div>
              <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                <AnimatePresence>{renderItems(outOfStockItems, 0.1)}</AnimatePresence>
              </motion.div>
            </div>
          )}
          {hiddenItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <EyeOff className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Hidden · {hiddenItems.length}</h2>
              </div>
              <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                <AnimatePresence>{renderItems(hiddenItems, 0.2)}</AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <MenuItemModal item={editingItem} categories={categories} modifierGroups={modifierGroups}
            onClose={() => { setShowModal(false); setEditingItem(null); }}
            onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}