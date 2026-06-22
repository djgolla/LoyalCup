import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuth } from "./AuthContext";
import { getBillingStatus, getShop, listMyShops } from "../api/shops";
import { getPosStatus } from "../services/posService";

export const ShopContext = createContext();

const SELECTED_SHOP_KEY = "loyalcup:selectedShopId";

export function ShopProvider({ children }) {
  const { user, profile, session } = useAuth();

  const [shop, setShop] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(() => {
    try {
      return window.localStorage.getItem(SELECTED_SHOP_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadingRef = useRef(false);

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
        setShops([]);
        return;
      }

      let billing = null;
      let ownerShops = [];

      if (userRole === "shop_owner" || userRole === "applicant") {
        try {
          billing = await getBillingStatus(token);
        } catch (billingErr) {
          if (billingErr?.status !== 404) {
            console.warn("[ShopContext] billing status failed:", billingErr.message);
          }
        }

        try {
          const shopsResponse = await listMyShops(token);
          ownerShops = shopsResponse?.shops || [];
          setShops(ownerShops);
        } catch (shopsErr) {
          if (shopsErr?.status !== 404) {
            console.warn("[ShopContext] owner shops load failed:", shopsErr.message);
          }
          ownerShops = billing?.shops || [];
          setShops(ownerShops);
        }
      }

      const fallbackShopId =
        profile?.shop_id ||
        billing?.shop_id ||
        ownerShops[0]?.id ||
        null;

      const savedShop = ownerShops.find((candidate) => candidate.id === selectedShopId);
      const profileShop = ownerShops.find((candidate) => candidate.id === fallbackShopId);
      const selectedShop = savedShop || profileShop || ownerShops[0] || null;
      const shopId = selectedShop?.id || fallbackShopId;

      if (!shopId) {
        setShop(null);
        return;
      }

      if (shopId !== selectedShopId) {
        setSelectedShopId(shopId);
        try {
          window.localStorage.setItem(SELECTED_SHOP_KEY, shopId);
        } catch {
          // Ignore storage failures; selection still works in memory.
        }
      }

      let publicShop = null;
      if (!selectedShop) {
        try {
          const shopResponse = await getShop(shopId);
          publicShop = shopResponse?.shop || null;
        } catch (shopErr) {
          console.warn("[ShopContext] public shop load failed:", shopErr.message);
        }
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
        ...(selectedShop || {}),

        id: shopId,

        status:
          selectedShop?.status ||
          billing?.shop_status ||
          null,

        subscription_status:
          selectedShop?.subscription_status ||
          billing?.status ||
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

  const selectShop = (shopId) => {
    if (!shopId) return;
    setSelectedShopId(shopId);
    const nextShop = shops.find((candidate) => candidate.id === shopId);
    if (nextShop) {
      setShop((current) => ({ ...(current || {}), ...nextShop, id: shopId }));
    }
    try {
      window.localStorage.setItem(SELECTED_SHOP_KEY, shopId);
    } catch {
      // Ignore storage failures; the state update above is enough for this session.
    }
  };

  useEffect(() => {
    if (!user) {
      setShop(null);
      setShops([]);
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
      setShops([]);
      setLoading(false);
      setError(null);
    }
  }, [user?.id, profile?.role, profile?.shop_id, session?.access_token, selectedShopId]);

  return (
    <ShopContext.Provider
      value={{
        shop,
        shops,
        shopId: shop?.id,
        selectedShopId,
        selectShop,
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
