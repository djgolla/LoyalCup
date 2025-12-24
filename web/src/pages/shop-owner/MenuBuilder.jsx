// MenuBuilder.jsx
// THE MAIN FEATURE - Visual menu builder with drag & drop

import { useEffect, useState } from "react";
import { Plus, Search, FolderTree, GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MenuItemCard from "../../components/shop-owner/MenuItemCard";
import MenuItemEditor from "../../components/shop-owner/MenuItemEditor";
import Loading from "../../components/Loading";
import Modal from "../../components/Modal";
import { useShop } from "../../context/ShopContext";
import supabase from "../../lib/supabase";

export default function MenuBuilder() {
  const { shopId, loading: shopLoading } = useShop();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Category editor state
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (shopId) {
      loadMenuData();
    }
  }, [shopId]);

  const loadMenuData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('shop_id', shopId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error("Failed to load menu data:", error);
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  // Category Management
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryEditorOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryEditorOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!shopId || !categoryName.trim()) return;

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('menu_categories')
          .update({ name: categoryName.trim() })
          .eq('id', editingCategory.id)
          .eq('shop_id', shopId);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        // Create new category
        const maxOrder = categories.length > 0 
          ? Math.max(...categories.map(c => c.display_order || 0)) 
          : 0;

        const { error } = await supabase
          .from('menu_categories')
          .insert({
            shop_id: shopId,
            name: categoryName.trim(),
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Category created");
      }

      setCategoryEditorOpen(false);
      loadMenuData();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error("Failed to save category");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!confirm(`Delete category "${category.name}"? Items in this category will remain but be uncategorized.`)) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', category.id)
        .eq('shop_id', shopId);

      if (error) throw error;
      toast.success("Category deleted");
      
      if (selectedCategory === category.id) {
        setSelectedCategory("all");
      }
      
      loadMenuData();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Menu Item Management
  const handleAddNew = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleSave = async (itemData) => {
    if (!shopId) {
      toast.error("Shop not found");
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        const { data, error } = await supabase
          .from('menu_items')
          .update({
            name: itemData.name,
            description: itemData.description,
            category_id: itemData.category_id,
            base_price: itemData.base_price,
            is_available: itemData.is_available,
            image_url: itemData.image_url,
          })
          .eq('id', editingItem.id)
          .eq('shop_id', shopId)
          .select()
          .single();

        if (error) throw error;

        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? data : item
        ));
        toast.success("Item updated successfully");
      } else {
        // Create new item
        const { data, error } = await supabase
          .from('menu_items')
          .insert({
            shop_id: shopId,
            name: itemData.name,
            description: itemData.description,
            category_id: itemData.category_id,
            base_price: itemData.base_price,
            is_available: itemData.is_available,
            image_url: itemData.image_url,
          })
          .select()
          .single();

        if (error) throw error;

        setMenuItems([data, ...menuItems]);
        toast.success("Item added successfully");
      }
      setEditorOpen(false);
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("Failed to save item: " + (error.message || "Unknown error"));
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    
    if (!shopId) {
      toast.error("Shop not found");
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', item.id)
        .eq('shop_id', shopId);

      if (error) throw error;

      setMenuItems(menuItems.filter(i => i.id !== item.id));
      toast.success("Item deleted");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleToggleAvailability = async (item) => {
    if (!shopId) {
      toast.error("Shop not found");
      return;
    }

    try {
      const newAvailability = !item.is_available;
      
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: newAvailability })
        .eq('id', item.id)
        .eq('shop_id', shopId);

      if (error) throw error;

      setMenuItems(menuItems.map(i => 
        i.id === item.id ? { ...i, is_available: newAvailability } : i
      ));
      toast.success(newAvailability ? "Item marked available" : "Item marked unavailable");
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      toast.error("Failed to update availability");
    }
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by category
  const itemsByCategory = {};
  categories.forEach(cat => {
    itemsByCategory[cat.id] = {
      category: cat,
      items: filteredItems.filter(item => item.category_id === cat.id)
    };
  });

  // Uncategorized items
  const uncategorizedItems = filteredItems.filter(item => !item.category_id || !categories.find(c => c.id === item.category_id));

  if (shopLoading || loading) return <Loading />;

  if (!shopId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Shop Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have a shop assigned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      
      {/* Left Sidebar - Categories */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FolderTree size={20} />
            Categories
          </h2>
          <button
            onClick={handleAddCategory}
            className="p-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            title="Add Category"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* All Items */}
        <button
          onClick={() => setSelectedCategory("all")}
          className={`w-full text-left px-3 py-2 rounded-lg transition mb-2 ${
            selectedCategory === "all"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
          }`}
        >
          All Items ({menuItems.length})
        </button>

        {/* Category List */}
        <div className="space-y-1">
          {categories.map((category) => {
            const itemCount = menuItems.filter(item => item.category_id === category.id).length;
            return (
              <div
                key={category.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  selectedCategory === category.id
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              >
                <GripVertical size={14} className="text-gray-400 cursor-grab" />
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex-1 text-left"
                >
                  {category.name} ({itemCount})
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                    title="Edit"
                  >
                    <Pencil size={12} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    title="Delete"
                  >
                    <Trash2 size={12} className="text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No categories yet
            </p>
            <button
              onClick={handleAddCategory}
              className="text-sm px-3 py-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
            >
              Add First Category
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Menu Builder</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedCategory === "all" 
                ? `${filteredItems.length} total items` 
                : `${filteredItems.length} items in ${categories.find(c => c.id === selectedCategory)?.name || 'category'}`
              }
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition shadow-md"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Menu Items Grid */}
        {selectedCategory === "all" ? (
          // Show all categories
          <div className="space-y-8">
            {categories.map(category => {
              const categoryItems = itemsByCategory[category.id]?.items || [];
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category.id}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    {category.name}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      ({categoryItems.length} items)
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryItems.map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleAvailability={handleToggleAvailability}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Uncategorized items */}
            {uncategorizedItems.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  Uncategorized
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({uncategorizedItems.length} items)
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {uncategorizedItems.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                <div className="text-6xl mb-4">☕</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No menu items yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Get started by adding your first menu item
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                >
                  Add First Item
                </button>
              </div>
            )}
          </div>
        ) : (
          // Show selected category only
          <div>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleAvailability={handleToggleAvailability}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                <div className="text-6xl mb-4">☕</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No items in this category</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery ? "Try adjusting your search" : "Add items to this category to get started"}
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                >
                  Add Item
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Editor Modal */}
      <MenuItemEditor
        item={editingItem}
        categories={categories}
        customizations={[]}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        shopId={shopId}
      />

      {/* Category Editor Modal */}
      <Modal open={categoryEditorOpen} onClose={() => setCategoryEditorOpen(false)}>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {editingCategory ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Category Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Hot Drinks"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCategoryEditorOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
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
