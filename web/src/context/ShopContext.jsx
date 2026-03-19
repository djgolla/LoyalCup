import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "./AuthContext";
import supabase from "../lib/supabase";

export const ShopContext = createContext();

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setShop(null);
      setLoading(false);
      setError(null);
      loadingRef.current = false;
      return;
    }

    const userRole = user.user_metadata?.role || "customer";

    if (userRole === "shop_owner" || userRole === "shop_worker" || userRole === "applicant") {
      loadShop();
    } else {
      setShop(null);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, user?.user_metadata?.role]); // ← only re-run on actual identity change, NOT every render

  const loadShop = async () => {
    if (!user) return;

    // Set loading TRUE at the top — prevents the layout from seeing shop=null prematurely
    setLoading(true);
    loadingRef.current = true;

    try {
      setError(null);
      const userRole = user?.user_metadata?.role || "customer";

      if (userRole === "shop_owner" || userRole === "applicant") {
        const { data, error: fetchError } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          // RLS 406 or PGRST116 means no row accessible — treat as no shop, NOT a crash
          const code = fetchError.code || "";
          const msg  = fetchError.message || "";
          if (
            code === "PGRST116" ||
            msg.includes("406") ||
            msg.includes("JSON") ||
            msg.includes("multiple") ||
            msg.includes("0 rows")
          ) {
            setShop(null);
          } else {
            console.error("ShopContext load error:", fetchError);
            setError(fetchError.message);
            setShop(null);
          }
          return;
        }
        setShop(data || null);

      } else if (userRole === "shop_worker") {
        const shopId = user.user_metadata?.shop_id;
        if (!shopId) {
          setError("No shop assigned to your account");
          setShop(null);
          return;
        }
        const { data, error: fetchError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .maybeSingle();

        if (fetchError) {
          console.error("ShopContext worker load error:", fetchError);
          setShop(null);
          return;
        }
        setShop(data || null);
      }
    } catch (err) {
      console.error("ShopContext unexpected error:", err);
      setError(err.message || "Failed to load shop");
      setShop(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return (
    <ShopContext.Provider
      value={{
        shop,
        shopId: shop?.id,
        loading,
        error,
        loadShop,
        refreshShop: loadShop,
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