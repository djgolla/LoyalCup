import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import CartItem from "../../components/customer/CartItem";
import Button from "../../components/Button";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export default function Cart() {
  const { cart, subtotal, tax, total, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  // empty cart state
  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShoppingCart size={64} className="text-gray-300 dark:text-neutral-700" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Your cart is empty
        </h2>
        <p className="text-gray-600 dark:text-neutral-400">
          Start adding items from your favorite shops
        </p>
        <Button onClick={() => navigate("/")}>
          Browse Shops
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Cart
        </h1>
      </div>

      {/* shop info */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          Order from
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {cart.shopName}
        </h2>
      </div>

      {/* cart items */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 divide-y divide-gray-200 dark:divide-neutral-800">
        {cart.items.map((item) => (
          <CartItem key={item.cartItemId} item={item} />
        ))}
      </div>

      {/* order summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Order Summary
        </h3>

        <div className="flex justify-between text-gray-600 dark:text-neutral-400">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-600 dark:text-neutral-400">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-3">
        <button
          onClick={clearCart}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
        >
          Clear Cart
        </button>
        
        <Button
          onClick={() => navigate("/checkout")}
          className="flex-1"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
