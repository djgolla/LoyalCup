import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Button from "../../components/Button";
import { CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { cart, subtotal, tax, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  // redirect if cart is empty
  if (!cart.shopId || cart.items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handlePlaceOrder = async () => {
    setLoading(true);

    // prepare order data
    const orderData = {
      shop_id: cart.shopId,
      items: cart.items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        base_price: item.base_price || item.price,
        customizations: item.customizations || []
      }))
    };

    try {
      // create order
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (response.ok) {
        // clear cart and navigate to confirmation
        clearCart();
        toast.success("Order placed successfully!");
        navigate(`/order-confirmation/${data.order.id}`);
      } else {
        toast.error("Failed to place order");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Checkout
      </h1>

      {/* order summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Order from {cart.shopName}
        </h2>

        <div className="space-y-2 text-sm">
          {cart.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">
                {item.quantity}x {item.name}
              </span>
              <span className="text-gray-900 dark:text-white">
                ${((item.base_price || item.price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="border-t border-gray-200 dark:border-neutral-800 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-neutral-400">Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* payment method */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
          Payment Method
        </h2>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <CreditCard size={20} />
            <span>Credit/Debit Card</span>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-neutral-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800">
            <input
              type="radio"
              name="payment"
              value="wallet"
              checked={paymentMethod === "wallet"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Wallet size={20} />
            <span>Digital Wallet</span>
          </label>
        </div>

        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-4">
          Note: This is a demo. No actual payment will be processed.
        </p>
      </div>

      {/* place order button */}
      <Button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Placing Order..." : "Place Order"}
      </Button>
    </div>
  );
}
