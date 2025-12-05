// MenuItemEditor.jsx
// Full featured modal for creating/editing menu items

import { useState, useEffect } from "react";
import Modal from "../Modal";
import ImageUploader from "./ImageUploader";

export default function MenuItemEditor({ item, categories, customizations, open, onClose, onSave }) {
  const getInitialFormData = () => {
    if (item) {
      return {
        name: item.name || "",
        description: item.description || "",
        category_id: item.category_id || "",
        base_price: item.base_price || "",
        is_available: item.is_available !== undefined ? item.is_available : true,
        image_url: item.image_url || "",
      };
    }
    return {
      name: "",
      description: "",
      category_id: categories?.[0]?.id || "",
      base_price: "",
      is_available: true,
      image_url: "",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [selectedCustomizations, setSelectedCustomizations] = useState(item?.customizations || []);

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (!open) return;
    
    const newFormData = getInitialFormData();
    const newCustomizations = item?.customizations || [];
    
    setFormData(newFormData);
    setSelectedCustomizations(newCustomizations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      base_price: parseFloat(formData.base_price),
      customizations: selectedCustomizations,
    });
  };

  const handleImageUpload = (file, preview) => {
    setFormData({ ...formData, image_url: preview });
  };

  const toggleCustomization = (customizationId) => {
    if (selectedCustomizations.includes(customizationId)) {
      setSelectedCustomizations(selectedCustomizations.filter(id => id !== customizationId));
    } else {
      setSelectedCustomizations([...selectedCustomizations, customizationId]);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-semibold mb-6">
        {item ? "Edit Menu Item" : "Add New Menu Item"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Image Upload */}
        <ImageUploader
          onUpload={handleImageUpload}
          currentImage={formData.image_url}
          label="Item Image"
        />

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Item Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Iced Vanilla Latte"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the item"
          />
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              required
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Base Price *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is-available"
            className="w-4 h-4 accent-amber-700"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          />
          <label htmlFor="is-available" className="text-sm font-medium">
            Item is available for ordering
          </label>
        </div>

        {/* Customizations */}
        {customizations && customizations.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Apply Customizations</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-lg p-3">
              {customizations.map(custom => (
                <div key={custom.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`custom-${custom.id}`}
                    className="w-4 h-4 accent-amber-700"
                    checked={selectedCustomizations.includes(custom.id)}
                    onChange={() => toggleCustomization(custom.id)}
                  />
                  <label htmlFor={`custom-${custom.id}`} className="text-sm">
                    {custom.name} ({custom.type === 'single_select' ? 'Single' : 'Multi'})
                    {custom.is_required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-800 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            {item ? "Save Changes" : "Add Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
