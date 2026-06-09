// context/CartContext.js
import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const buildCartItem = (item) => {
    // unique key = item id + modifiers so same drink with diff mods = separate cart entries
    const modKey = JSON.stringify((item.customizations || []).map(c => c.id).sort());
    const cartKey = `${item.id}__${modKey}`;
    const incomingQty = Math.max(1, item.quantity || 1);

    return {
      ...item,
      cartKey,
      quantity: incomingQty,
    };
  };

  const addItemToExistingCart = (prevCart, newItem) => {
    const existingItem = prevCart.find(i => i.cartKey === newItem.cartKey);

    if (existingItem) {
      return prevCart.map(i =>
        i.cartKey === newItem.cartKey
          ? { ...i, quantity: (i.quantity || 1) + (newItem.quantity || 1) }
          : i
      );
    }

    return [...prevCart, newItem];
  };

  const addItem = (item) => {
    const newItem = buildCartItem(item);

    const currentShopId = cart[0]?.shopId;
    const currentShopName = cart[0]?.shopName || 'another shop';
    const incomingShopId = newItem.shopId;
    const incomingShopName = newItem.shopName || 'this shop';

    // Launch rule: one shop per cart. This protects checkout, loyalty, Square quote,
    // and order logic everywhere addItem is called.
    if (
      cart.length > 0 &&
      currentShopId &&
      incomingShopId &&
      currentShopId !== incomingShopId
    ) {
      Alert.alert(
        'Start a new cart?',
        `Your cart has items from ${currentShopName}. Adding an item from ${incomingShopName} will clear your current cart.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Cart & Add',
            style: 'destructive',
            onPress: () => setCart([newItem]),
          },
        ]
      );
      return;
    }

    setCart(prevCart => addItemToExistingCart(prevCart, newItem));
  };

  const removeItem = (cartKey) => {
    setCart(prevCart => prevCart.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.cartKey === cartKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const getItemCount = () =>
    cart.reduce((total, item) => total + (item.quantity || 1), 0);

  const getTotalPrice = () =>
    cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);

  const getCartShopId = () => cart[0]?.shopId || null;

  const getCartShopName = () => cart[0]?.shopName || null;

  const hasMultipleShops = () => {
    const shopIds = new Set(cart.map(item => item.shopId).filter(Boolean));
    return shopIds.size > 1;
  };

  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      getTotalPrice,
      getCartShopId,
      getCartShopName,
      hasMultipleShops,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}