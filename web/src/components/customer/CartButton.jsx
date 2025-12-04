import { useCart } from "../../context/CartContext";
import { ShoppingCart } from "lucide-react";

export default function CartButton({ onClick }) {
  const { itemCount, total } = useCart();

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary-500 text-white px-6 py-4 rounded-full shadow-lg hover:bg-primary-600 flex items-center gap-3 z-50"
    >
      <div className="relative">
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </div>
      <div className="text-left">
        <div className="text-sm font-medium">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </div>
        <div className="text-xs opacity-90">
          ${total.toFixed(2)}
        </div>
      </div>
    </button>
  );
}
