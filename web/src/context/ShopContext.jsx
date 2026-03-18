import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import supabase from "../lib/supabase";

export const ShopContext = createContext();

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setShop(null);
      setLoading(false);
      setError(null);
      return;
    }

    const userRole = user.user_metadata?.role || "customer";

    if (userRole === "shop_owner" || userRole === "shop_worker") {
      loadShop();
    } else {
      setShop(null);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  const loadShop = async () => {
    try {
      setError(null);
      const userRole = user?.user_metadata?.role || "customer";

      if (userRole === "shop_owner") {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            setError("No shop assigned to your account");
            setShop(null);
          } else {
            throw error;
          }
        } else {
          setShop(data);
        }
      } else if (userRole === "shop_worker") {
        const shopId = user.user_metadata?.shop_id;
        if (shopId) {
          const { data, error } = await supabase
            .from("shops")
            .select("*")
            .eq("id", shopId)
            .single();

          if (error) throw error;
          setShop(data);
        } else {
          setError("No shop assigned to your account");
          setShop(null);
        }
      }
    } catch (err) {
      console.error("Failed to load shop:", err);
      setError(err.message || "Failed to load shop");
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
        error,
        loadShop,        // ← what ShopSettings calls
        refreshShop: loadShop, // ← keep old name too so nothing else breaks
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