import React, { createContext, useState, useEffect, useContext, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CartContext = createContext({})

const CART_STORAGE_KEY = '@cart_items'
const SAVE_DEBOUNCE_MS = 500

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef(null)

  // load cart from storage on mount
  useEffect(() => {
    loadCart()
  }, [])

  // save cart to storage whenever it changes (debounced)
  useEffect(() => {
    if (!loading) {
      // clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        saveCart()
      }, SAVE_DEBOUNCE_MS)
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [items])

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        setItems(JSON.parse(savedCart))
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save cart:', error)
    }
  }

  const addItem = (item) => {
    setItems(currentItems => {
      const existingIndex = currentItems.findIndex(i => i.id === item.id)
      
      if (existingIndex > -1) {
        // item exists, increase quantity
        const newItems = [...currentItems]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + (item.quantity || 1)
        }
        return newItems
      }
      
      // new item, add to cart
      return [...currentItems, { ...item, quantity: item.quantity || 1 }]
    })
  }

  const removeItem = (itemId) => {
    setItems(currentItems => currentItems.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  }

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  const value = {
    items,
    loading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
