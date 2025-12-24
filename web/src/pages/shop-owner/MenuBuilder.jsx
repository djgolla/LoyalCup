// MenuBuilder.jsx
// THE MAIN FEATURE - Visual menu builder with drag & drop

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import MenuItemCard from "../../components/shop-owner/MenuItemCard";
import MenuItemEditor from "../../components/shop-owner/MenuItemEditor";
import Loading from "../../components/Loading";
import {
  getMenuItems,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
} from "../../api/menu";
import { getCustomizationTemplates } from "../../api/menu";
import { useShop } from "../../context/ShopContext";

export default function MenuBuilder() {
  const { shopId, loading: shopLoading } = useShop();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (shopId) {
      loadMenuData();
    }
  }, [shopId]);

  const loadMenuData = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const [itemsRes, categoriesRes, customizationsRes] = await Promise.all([
        getMenuItems(shopId),
        getCategories(shopId),
        getCustomizationTemplates(shopId),
      ]);
      
      setMenuItems(itemsRes.items || []);
      setCategories(categoriesRes.categories || []);
      setCustomizations(customizationsRes.templates || []);
    } catch (error) {
      console.error("Failed to load menu data:", error);
      toast.error("Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

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
        const response = await updateMenuItem(shopId, editingItem.id, itemData);
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? { ...item, ...response.item } : item
        ));
        toast.success("Item updated successfully");
      } else {
        // Create new item
        const response = await createMenuItem(shopId, itemData);
        setMenuItems([...menuItems, response.item]);
        toast.success("Item added successfully");
      }
      setEditorOpen(false);
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    
    if (!shopId) {
      toast.error("Shop not found");
      return;
    }

    try {
      await deleteMenuItem(shopId, item.id);
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
      await toggleItemAvailability(shopId, item.id, newAvailability);
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
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  if (shopLoading || loading) return <Loading />;

  if (!shopId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏪</div>
        <h3 className="text-xl font-semibold mb-2">No Shop Found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have a shop assigned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu Builder</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select
          className="px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Menu Items by Category */}
      {selectedCategory === "all" ? (
        // Show all categories
        <div className="space-y-8">
          {categories.map(category => {
            const categoryItems = itemsByCategory[category.id]?.items || [];
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {category.name}
                  <span className="text-sm font-normal text-gray-500">
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
          
          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-xl font-semibold mb-2">No menu items yet</h3>
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
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No items found in this category
            </div>
          )}
        </div>
      )}

      {/* Item Editor Modal */}
      <MenuItemEditor
        item={editingItem}
        categories={categories}
        customizations={customizations}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
