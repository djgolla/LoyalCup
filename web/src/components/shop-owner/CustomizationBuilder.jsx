// CustomizationBuilder.jsx
// Component for building customization templates

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function CustomizationBuilder({ template, onChange }) {
  const [optionInput, setOptionInput] = useState({ name: "", price: "" });

  const addOption = () => {
    if (!optionInput.name) return;
    
    const newOption = {
      name: optionInput.name,
      price: parseFloat(optionInput.price) || 0,
    };
    
    onChange({
      ...template,
      options: [...(template.options || []), newOption],
    });
    
    setOptionInput({ name: "", price: "" });
  };

  const removeOption = (index) => {
    const newOptions = template.options.filter((_, i) => i !== index);
    onChange({ ...template, options: newOptions });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...template.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : value,
    };
    onChange({ ...template, options: newOptions });
  };

  return (
    <div className="space-y-4">
      
      {/* Template Name */}
      <div>
        <label className="block text-sm font-medium mb-2">Template Name *</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
          value={template.name || ""}
          onChange={(e) => onChange({ ...template, name: e.target.value })}
          placeholder="e.g., Size, Milk Options"
        />
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Selection Type *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="single_select"
              checked={template.type === "single_select"}
              onChange={(e) => onChange({ ...template, type: e.target.value })}
              className="accent-amber-700"
            />
            <span>Single Select</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="multi_select"
              checked={template.type === "multi_select"}
              onChange={(e) => onChange({ ...template, type: e.target.value })}
              className="accent-amber-700"
            />
            <span>Multi Select</span>
          </label>
        </div>
      </div>

      {/* Required Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is-required"
          className="w-4 h-4 accent-amber-700"
          checked={template.is_required || false}
          onChange={(e) => onChange({ ...template, is_required: e.target.checked })}
        />
        <label htmlFor="is-required" className="text-sm font-medium">
          Required customization
        </label>
      </div>

      {/* Options List */}
      <div>
        <label className="block text-sm font-medium mb-2">Options</label>
        <div className="space-y-2 mb-3">
          {template.options?.map((option, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
                value={option.name}
                onChange={(e) => updateOption(index, 'name', e.target.value)}
                placeholder="Option name"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-20 px-2 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
                  value={option.price}
                  onChange={(e) => updateOption(index, 'price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Option */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
            value={optionInput.name}
            onChange={(e) => setOptionInput({ ...optionInput, name: e.target.value })}
            placeholder="Add option name"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
          />
          <div className="flex items-center gap-1">
            <span className="text-sm">$</span>
            <input
              type="number"
              step="0.01"
              className="w-20 px-2 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
              value={optionInput.price}
              onChange={(e) => setOptionInput({ ...optionInput, price: e.target.value })}
              placeholder="0.00"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
            />
          </div>
          <button
            type="button"
            onClick={addOption}
            className="p-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
