import { useState } from "react";
import { useCart } from "../../context/CartContext";
import Modal from "../Modal";
import CustomizationSelector from "./CustomizationSelector";
import Button from "../Button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function MenuItemCard({ item, shopId, shopName }) {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    // check if switching shops
    const cart = JSON.parse(localStorage.getItem("cart") || "{}");
    if (cart.shopId && cart.shopId !== shopId) {
      if (!confirm("This will clear your current cart. Continue?")) {
        return;
      }
    }

    addItem(shopId, shopName, item, selectedCustomizations, quantity);
    toast.success(`Added ${item.name} to cart`);
    setShowCustomization(false);
    setSelectedCustomizations([]);
    setQuantity(1);
  };

  const handleQuickAdd = () => {
    // quick add without customizations
    addItem(shopId, shopName, item, [], 1);
    toast.success(`Added ${item.name} to cart`);
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition">
        {/* item image */}
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center">
            <span className="text-3xl">☕</span>
          </div>
        )}

        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {item.name}
            </h3>
            <span className="text-primary-500 font-semibold whitespace-nowrap">
              ${(item.base_price || item.price).toFixed(2)}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 dark:text-neutral-400 line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleQuickAdd}
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 text-sm font-medium"
            >
              Quick Add
            </button>
            
            <button
              onClick={() => setShowCustomization(true)}
              className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* customization modal */}
      {showCustomization && (
        <Modal onClose={() => setShowCustomization(false)}>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Customize {item.name}
            </h2>

            <CustomizationSelector
              customizations={selectedCustomizations}
              onChange={setSelectedCustomizations}
            />

            {/* quantity selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  +
                </button>
              </div>
            </div>

            <Button onClick={handleAddToCart} className="w-full">
              Add to Cart - ${((item.base_price || item.price) * quantity).toFixed(2)}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
