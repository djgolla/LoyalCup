// Categories.jsx
// Manage menu categories

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import Modal from "../../components/Modal";
import Loading from "../../components/Loading";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/menu";
import { useShop } from "../../context/ShopContext";

export default function Categories() {
  const { shopId, loading: shopLoading } = useShop();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", display_order: 0 });

  useEffect(() => {
    if (shopId) {
      loadCategories();
    }
  }, [shopId]);

  const loadCategories = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const response = await getCategories(shopId);
      setCategories(response.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({ name: "", display_order: categories.length });
    setEditorOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      display_order: category.display_order 
    });
    setEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shopId) return;
    
    try {
      if (editingCategory) {
        await updateCategory(shopId, editingCategory.id, formData);
        toast.success("Category updated");
      } else {
        await createCategory(shopId, formData);
        toast.success("Category created");
      }
      setEditorOpen(false);
      loadCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (category) => {
    if (!shopId) return;
    if (!confirm(`Delete category "${category.name}"?`)) return;
    
    try {
      await deleteCategory(SHOP_ID, category.id);
      toast.success("Category deleted");
      loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu Categories</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No categories yet</p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-neutral-800">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
              >
                <GripVertical className="text-gray-400 cursor-grab" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Display Order: {category.display_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Modal open={editorOpen} onClose={() => setEditorOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">
          {editingCategory ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hot Drinks"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Display Order</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
