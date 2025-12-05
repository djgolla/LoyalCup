import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartButton() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Link
      to="/cart"
      className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-amber-700 transition"
    >
      <ShoppingCart size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
