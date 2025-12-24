import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import supabase from "../lib/supabase";

export const ShopContext = createContext();

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShop(null);
      setLoading(false);
      return;
    }

    const userRole = user.user_metadata?.role || 'customer';
    
    // Only load shop for shop owners and workers
    if (userRole === 'shop_owner' || userRole === 'shop_worker') {
      loadUserShop();
    } else {
      setShop(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserShop = async () => {
    try {
      const userRole = user.user_metadata?.role || 'customer';
      
      if (userRole === 'shop_owner') {
        // Get shop owned by this user
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (error) throw error;
        setShop(data);
      } else if (userRole === 'shop_worker') {
        // For workers, we'd need a shop_workers junction table
        // For now, get from user_metadata if available
        const shopId = user.user_metadata?.shop_id;
        if (shopId) {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('id', shopId)
            .single();

          if (error) throw error;
          setShop(data);
        }
      }
    } catch (error) {
      console.error("Failed to load shop:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopContext.Provider
      value={{
        shop,
        shopId: shop?.id,
        loading,
        refreshShop: loadUserShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
