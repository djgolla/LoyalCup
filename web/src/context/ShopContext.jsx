import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getShop, getBillingStatus } from "../api/shops";

export const ShopContext = createContext();

export function ShopProvider({ children }) {
  const { user, profile, session } = useAuth();

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

    const userRole = profile?.role || "customer";

    if (userRole === "shop_owner" || userRole === "shop_worker" || userRole === "applicant") {
      loadShop();
    } else {
      setShop(null);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, profile?.role, profile?.shop_id, session?.access_token]);

  const loadShop = async () => {
    if (!user) return;

    setLoading(true);
    loadingRef.current = true;

    try {
      setError(null);

      const userRole = profile?.role || "customer";
      const token = session?.access_token || null;

      if (userRole !== "shop_owner" && userRole !== "shop_worker" && userRole !== "applicant") {
        setShop(null);
        return;
      }

      let billing = null;

      if (userRole === "shop_owner" || userRole === "applicant") {
        try {
          billing = await getBillingStatus(token);
        } catch (billingErr) {
          if (billingErr?.status !== 404) {
            console.warn("[ShopContext] billing status failed:", billingErr.message);
          }
        }
      }

      const shopId =
        profile?.shop_id ||
        billing?.shop_id ||
        null;

      if (!shopId) {
        setShop(null);
        return;
      }

      let publicShop = null;

      try {
        const shopResponse = await getShop(shopId);
        publicShop = shopResponse?.shop || null;
      } catch (shopErr) {
        // This can happen before the shop is active because public shop detail
        // only exposes active shops. We still keep a minimal shop object from
        // profile/billing so subscribe/onboarding does not break.
        console.warn("[ShopContext] public shop load failed:", shopErr.message);
      }

      setShop({
        ...(publicShop || {}),
        id: shopId,
        status: billing?.shop_status || publicShop?.status || null,
        subscription_status: billing?.status || publicShop?.subscription_status || null,
        stripe_subscription_id: billing?.subscription_id || null,
      });
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