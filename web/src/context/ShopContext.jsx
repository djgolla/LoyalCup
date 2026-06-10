import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getShop, getBillingStatus } from "../api/shops";
import { getPosStatus } from "../services/posService";

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
        // Public shop detail may fail before active/public visibility.
        // Keep onboarding alive using billing/profile shop id.
        console.warn("[ShopContext] public shop load failed:", shopErr.message);
      }

      let posStatus = null;

      try {
        posStatus = await getPosStatus(shopId, "square");
      } catch (posErr) {
        console.warn("[ShopContext] POS status failed:", posErr.message);
      }

      const squareConnected =
        posStatus?.connected === true ||
        posStatus?.status === "connected" ||
        posStatus?.status === "active" ||
        posStatus?.provider === "square" ||
        !!posStatus?.merchant_id ||
        !!posStatus?.location_id;

      setShop({
        ...(publicShop || {}),

        id: shopId,

        status:
          billing?.shop_status ||
          publicShop?.status ||
          null,

        subscription_status:
          billing?.status ||
          publicShop?.subscription_status ||
          null,

        stripe_subscription_id:
          billing?.subscription_id ||
          null,

        // SECURITY NOTE:
        // We do NOT expose the real Square merchant ID from the DB anymore.
        // This is only a compatibility flag for old frontend layout checks
        // that were doing `if (!shop.square_merchant_id) lock page`.
        square_merchant_id: squareConnected ? "connected" : null,

        // New safe flags for frontend checks.
        pos_connected: squareConnected,
        pos_provider: "square",
        pos_status: posStatus?.status || null,
        pos_needs_reauth: posStatus?.needs_reauth === true || posStatus?.status === "reauth_required",
        square_location_id: posStatus?.location_id || null,
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