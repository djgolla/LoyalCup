// Customizations.jsx
// Manage customization templates

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "../../components/Modal";
import Loading from "../../components/Loading";
import CustomizationBuilder from "../../components/shop-owner/CustomizationBuilder";
import { useShop } from "../../context/ShopContext";
import {
  getCustomizationTemplates,
  createCustomizationTemplate,
  updateCustomizationTemplate,
  deleteCustomizationTemplate,
} from "../../api/menu";

export default function Customizations() {
  const { shopId } = useShop();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "single_select",
    is_required: false,
    applies_to: "all_items",
    options: [],
  });

  useEffect(() => {
    if (shopId) {
      loadTemplates();
    }
  }, [shopId]);

  const loadTemplates = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const response = await getCustomizationTemplates(shopId);
      setTemplates(response.templates || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load customization templates");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      type: "single_select",
      is_required: false,
      applies_to: "all_items",
      options: [],
    });
    setEditorOpen(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData(template);
    setEditorOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.options || formData.options.length === 0) {
      toast.error("Please add at least one option");
      return;
    }

    try {
      if (editingTemplate) {
        await updateCustomizationTemplate(shopId, editingTemplate.id, formData);
        toast.success("Template updated");
      } else {
        await createCustomizationTemplate(shopId, formData);
        toast.success("Template created");
      }
      setEditorOpen(false);
      loadTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    
    try {
      await deleteCustomizationTemplate(shopId, template.id);
      toast.success("Template deleted");
      loadTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customization Templates</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create reusable customization options for your menu items
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          <Plus size={20} />
          Add Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md p-12 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-xl font-semibold mb-2">No customization templates yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create templates like Size, Milk Options, or Add-ons
          </p>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-md p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.type === "single_select" ? "Single Select" : "Multi Select"}
                    {template.is_required && " • Required"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                {template.options?.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm p-2 bg-gray-50 dark:bg-neutral-800 rounded"
                  >
                    <span>{option.name}</span>
                    <span className="font-medium">
                      {option.price > 0 ? `+$${option.price.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Modal open={editorOpen} onClose={() => setEditorOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">
          {editingTemplate ? "Edit Template" : "Create Template"}
        </h2>
        <form onSubmit={handleSave}>
          <CustomizationBuilder
            template={formData}
            onChange={setFormData}
          />
          <div className="flex gap-3 mt-6">
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
              {editingTemplate ? "Save Changes" : "Create Template"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
