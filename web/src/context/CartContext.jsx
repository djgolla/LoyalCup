import { createContext, useState, useEffect, useContext } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  // cart state management with localStorage persistence
  
  const [cart, setCart] = useState(() => {
    // load from localStorage on init
    const saved = localStorage.getItem("cart");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      shopId: null,
      shopName: null,
      items: []
    };
  });

  // persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // add item to cart
  const addItem = (shopId, shopName, menuItem, customizations, quantity = 1) => {
    setCart((prev) => {
      // if switching shops, clear cart
      if (prev.shopId && prev.shopId !== shopId) {
        return {
          shopId,
          shopName,
          items: [{
            ...menuItem,
            customizations,
            quantity,
            cartItemId: Date.now().toString()
          }]
        };
      }

      // add to existing shop cart
      return {
        shopId,
        shopName,
        items: [
          ...prev.items,
          {
            ...menuItem,
            customizations,
            quantity,
            cartItemId: Date.now().toString()
          }
        ]
      };
    });
  };

  // remove item from cart
  const removeItem = (cartItemId) => {
    setCart((prev) => {
      const newItems = prev.items.filter(item => item.cartItemId !== cartItemId);
      
      // if cart is empty, clear shop info
      if (newItems.length === 0) {
        return { shopId: null, shopName: null, items: [] };
      }
      
      return { ...prev, items: newItems };
    });
  };

  // update item quantity
  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setCart((prev) => ({
      ...prev,
      items: prev.items.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    }));
  };

  // clear entire cart
  const clearCart = () => {
    setCart({ shopId: null, shopName: null, items: [] });
  };

  // calculate item price including customizations
  const getItemPrice = (item) => {
    let price = item.base_price || item.price || 0;
    
    if (item.customizations) {
      item.customizations.forEach(custom => {
        if (custom.price) {
          price += custom.price;
        }
      });
    }
    
    return price;
  };

  // computed values
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (getItemPrice(item) * item.quantity);
  }, 0);

  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      tax,
      total,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

// custom hook for using cart
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
