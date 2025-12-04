import { useCart } from "../../context/CartContext";

export default function Cart() {
  const { items, getTotal, clearCart } = useCart();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Shopping Cart
      </h1>
      {items.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-xl border border-gray-200 dark:border-neutral-800 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your cart is empty
          </p>
          <a
            href="/shops"
            className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
          >
            Browse Shops
          </a>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-bold text-amber-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-2xl font-bold text-amber-700">
                ${getTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Clear Cart
              </button>
              <a
                href="/checkout"
                className="flex-1 px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-center"
              >
                Checkout
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
