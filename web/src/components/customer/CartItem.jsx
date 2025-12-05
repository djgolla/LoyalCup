import { useCart } from "../../context/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart();

  // calculate item price with customizations
  const basePrice = item.base_price || item.price || 0;
  const customizationPrice = (item.customizations || []).reduce(
    (sum, c) => sum + (c.price || 0),
    0
  );
  const itemPrice = basePrice + customizationPrice;

  return (
    <div className="p-4">
      <div className="flex gap-4">
        {/* item info */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h3>
          
          {/* customizations */}
          {item.customizations && item.customizations.length > 0 && (
            <ul className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
              {item.customizations.map((custom, idx) => (
                <li key={idx}>
                  • {custom.name}
                  {custom.price > 0 && ` (+$${custom.price.toFixed(2)})`}
                </li>
              ))}
            </ul>
          )}

          {/* price */}
          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-2">
            ${itemPrice.toFixed(2)} each
          </p>
        </div>

        {/* quantity controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
              className="w-8 h-8 rounded-lg border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center"
            >
              <Minus size={14} />
            </button>
            
            <span className="w-8 text-center font-medium">
              {item.quantity}
            </span>
            
            <button
              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
              className="w-8 h-8 rounded-lg border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* total price */}
          <p className="font-semibold text-gray-900 dark:text-white">
            ${(itemPrice * item.quantity).toFixed(2)}
          </p>

          {/* remove button */}
          <button
            onClick={() => removeItem(item.cartItemId)}
            className="text-red-500 hover:text-red-600 p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
