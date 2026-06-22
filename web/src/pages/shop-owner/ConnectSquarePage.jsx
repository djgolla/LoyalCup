// web/src/pages/shop-owner/ConnectSquarePage.jsx - PASTE ENTIRE FILE

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  getSquareConnectUrl,
  getPosStatus,
  triggerPosSync,
  setSquareLocation,
} from "../../services/posService";
import { toast } from "sonner";
import PageLoader from "../../components/ui/PageLoader";

export default function ConnectSquarePage() {
  const { shop, loading: shopLoading, loadShop } = useShop();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posStatus, setPosStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [settingLocation, setSettingLocation] = useState(false);

  const callbackStatus     = searchParams.get("status");
  const callbackSynced     = searchParams.get("synced");
  const callbackItems      = searchParams.get("items");
  const callbackError      = searchParams.get("reason");
  const needsLocationParam = searchParams.get("needs_location") === "true";
  const callbackLocationId = searchParams.get("location_id");

  const shopId = shop?.id;

  const loadStatus = useCallback(async () => {
    if (!shopId) return;
    try {
      setLoadingStatus(true);
      const data = await getPosStatus(shopId, "square");
      setPosStatus(data);
      if (data?.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("[ConnectSquare] Error loading status:", err);
      setPosStatus(null);
      if (err.needsReauth) {
        setError("Square connection expired. Please reconnect.");
      }
    } finally {
      setLoadingStatus(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopLoading && shopId) {
      loadStatus();
    }
  }, [shopId, shopLoading, loadStatus]);

  // Handle OAuth callback redirect
  useEffect(() => {
    if (!callbackStatus) return;

    console.log("[ConnectSquare] Callback received:", { callbackStatus, callbackError, callbackItems });

    if (callbackStatus === "connected") {
      setSyncResult({ status: "connected", synced: callbackSynced, items: callbackItems });
      if (needsLocationParam) {
        setShowLocationPicker(true);
      } else if (callbackLocationId) {
        toast.success("Square connected and location set!");
      } else {
        toast.success("Square connected!");
      }
      // Catch the case where OAuth completed but sync pulled 0 items
      if (callbackSynced === "true" && Number(callbackItems || 0) === 0) {
        setWarning(
          "Square connected, but no menu items were imported. " +
          "Either your Square account has no items, or you OAuth'd into the wrong account/environment. " +
          "You can try Sync again below, or go add items in Square Dashboard first."
        );
      }
      loadShop();
      setTimeout(loadStatus, 1500);
    } else if (callbackStatus === "error") {
      const messages = {
        access_denied:         "Connection cancelled. You can connect Square anytime.",
        token_exchange_failed: "Square connection failed. Please try again.",
        invalid_state:         "Session error. Please try connecting again.",
        missing_params:        "Something went wrong with the Square redirect. Please try again.",
      };
      setError(messages[callbackError] || `Connection failed: ${callbackError}`);
      toast.error(messages[callbackError] || "Connection failed");
    }

    window.history.replaceState({}, "", "/shop-owner/connect-square");
  }, [callbackStatus, callbackError, callbackSynced, callbackItems, needsLocationParam, callbackLocationId]);

  const openLocationPicker = () => {
    if (posStatus?.needs_reauth || posStatus?.status === "reauth_required") {
      toast.error("Reconnect Square first, then pick a location.");
      return;
    }
    if (!posStatus?.locations || posStatus.locations.length === 0) {
      toast.error("No Square locations found. Try reconnecting your account.");
      return;
    }
    setShowLocationPicker(true);
  };

  const handleConnect = async () => {
    setError(null);
    setWarning(null);
    setConnecting(true);
    try {
      const { authorization_url } = await getSquareConnectUrl(shopId);
      window.location.href = authorization_url;
    } catch (e) {
      setError(e.message || "Failed to start Square connection. Check your server config.");
      toast.error("Failed to start Square connection");
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!shopId) return;
    setError(null);
    setWarning(null);
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await triggerPosSync(shopId, "square");
      console.log("[ConnectSquare] sync result:", result);

      if (result?.success === false && result?.warning) {
        // Backend says: connected but Square returned nothing
        setWarning(result.warning);
        setSyncResult({ status: "warning", synced: result });
        toast.warning("Sync ran, but Square returned no items.");
      } else {
        setSyncResult({ status: "success", synced: result });
        toast.success(`Sync complete! ${result.items_synced || 0} items updated.`);
      }
      await loadStatus();
    } catch (e) {
      const msg = e.message || "Sync failed. Please try again.";
      setError(msg);
      if (e.needsReauth) {
        toast.error("Square connection expired — reconnect required.");
        await loadStatus();
      } else {
        toast.error(msg);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleForceRefresh = async () => {
    setError(null);
    setWarning(null);
    setSyncResult(null);
    toast.info("Re-checking Square connection…");
    await loadShop();
    await loadStatus();
  };

  const handleSetLocation = async (locationId) => {
    if (!shopId) return;
    setSettingLocation(true);
    try {
      await setSquareLocation(shopId, locationId);
      setShowLocationPicker(false);
      await loadStatus();
      await loadShop();
      toast.success("Square location set! You're ready to accept orders.");
    } catch (e) {
      setError(e.message || "Failed to set location.");
      toast.error(e.message || "Failed to set location");
    } finally {
      setSettingLocation(false);
    }
  };

  const isConnected   = posStatus?.status === "connected";
  const needsReauth   = posStatus?.needs_reauth || posStatus?.status === "reauth_required";
  const locations     = posStatus?.locations || [];

  if (shopLoading && !syncResult) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/shop-owner/settings")}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 flex items-center gap-1 transition"
        >
          ← Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">POS Integration</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Square is <strong>required</strong> to accept mobile orders. Orders go directly into your Square account.
        </p>
      </div>

      {/* How orders reach you (auto-print / MOBILE) */}
      <div className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-start gap-3">
          <span className="text-blue-500 text-xl shrink-0">🖨️</span>
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">How mobile orders reach you</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
              Every paid LoyalCup order drops straight into your <strong>Square Orders</strong>, clearly marked{" "}
              <strong>“MOBILE”</strong> on the ticket — exactly like a normal Square order. Your baristas just make it
              and hand it over. There are no status buttons to tap and no extra screen to watch.
            </p>
            <div className="bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">✅ One-time setup: turn on auto-print</p>
              In your Square printer/hardware settings, enable <strong>automatic printing for online orders</strong>.
              Then every LoyalCup order prints at your counter the moment it's placed.
            </div>
          </div>
        </div>
      </div>

      {/* REAUTH REQUIRED BANNER */}
      {needsReauth && (
        <div className="mb-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 p-5">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-2xl shrink-0">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-1">
                Square connection expired
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                Your Square access token is no longer valid. Reconnect your Square account to keep accepting orders.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
                >
                  {connecting ? "Redirecting…" : "Reconnect Square →"}
                </button>
                <button
                  onClick={handleForceRefresh}
                  className="bg-white dark:bg-neutral-800 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
                >
                  Re-check connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning banner (e.g. connected but 0 items) */}
      {warning && (
        <div className="mb-6 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">Heads up</p>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">{warning}</p>
          </div>
          <button
            onClick={() => setWarning(null)}
            className="text-yellow-400 hover:text-yellow-600 text-lg leading-none mt-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Success banner */}
      {syncResult?.status === "connected" && (
        <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
          <span className="text-green-500 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Square Connected!</p>
            {syncResult.synced === "true" && Number(syncResult.items || 0) > 0 && (
              <p className="text-green-700 dark:text-green-400 text-sm mt-0.5">
                {syncResult.items} menu items imported.{" "}
                <button
                  className="underline font-medium hover:no-underline"
                  onClick={() => navigate("/shop-owner/menu")}
                >
                  Review in Menu Builder →
                </button>
              </p>
            )}
            {syncResult.synced === "partial" && (
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-0.5">
                Connected but menu sync had an issue. Use Sync below to retry.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sync result banner */}
      {syncResult?.status === "success" && (
        <div className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="font-semibold text-blue-800 dark:text-blue-300">Sync Complete</p>
          <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
            {syncResult.synced?.categories_synced || 0} categories, {syncResult.synced?.items_synced || 0} items,{" "}
            {syncResult.synced?.modifier_groups_synced || 0} modifier groups updated.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && !needsReauth && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Something went wrong</p>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-lg leading-none mt-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Location picker */}
      {showLocationPicker && locations.length > 0 && (
        <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 p-5">
          <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-1">
            {locations.length === 1 ? "Confirm Your Square Location" : "Select Your Square Location"}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
            {locations.length === 1
              ? "Confirm this is the location where orders should print."
              : "Choose which Square terminal receives mobile orders."}
          </p>
          <div className="space-y-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSetLocation(loc.id)}
                disabled={settingLocation}
                className="w-full flex items-center justify-between text-left px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition disabled:opacity-60"
              >
                <span className="font-medium text-gray-900 dark:text-white">{loc.name}</span>
                <span className="text-xs text-gray-400 font-mono">{loc.id}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLocationPicker(false)}
            className="mt-3 text-xs text-amber-600 hover:text-amber-700 underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Square card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-neutral-700">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
            ■
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white">Square</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Required · Import menu · sync inventory · process payments
            </p>
          </div>
          {loadingStatus ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : needsReauth ? (
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-3 py-1 rounded-full">
              Reconnect Required
            </span>
          ) : isConnected ? (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
              Connected
            </span>
          ) : (
            <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
              Required
            </span>
          )}
        </div>

        <div className="p-6">
          {isConnected && !needsReauth ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Merchant ID</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
                    {posStatus?.merchant_id || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  {posStatus?.location_id ? (
                    <span className="text-green-600 dark:text-green-400 font-medium text-xs">Set ✓</span>
                  ) : (
                    <button
                      onClick={openLocationPicker}
                      className="text-amber-600 hover:text-amber-700 text-xs font-semibold underline"
                    >
                      Select location →
                    </button>
                  )}
                </div>
                {!posStatus?.location_id && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg font-semibold">
                    ⛔ You must select a Square location before any orders can be accepted.
                  </p>
                )}
                {posStatus?.last_updated && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Last synced</span>
                    <span className="text-gray-700 dark:text-gray-300 text-xs">
                      {new Date(posStatus.last_updated).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Auto-print reminder when fully live */}
              {posStatus?.location_id && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400">
                  <span className="shrink-0">🖨️</span>
                  <span>
                    You're live! Make sure <strong>auto-print for online orders</strong> is on in Square so every
                    “MOBILE” ticket prints automatically at your counter.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-60"
                >
                  {syncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    "↻ Sync Menu from Square"
                  )}
                </button>
                <button
                  onClick={() => navigate("/shop-owner/menu")}
                  className="flex-1 border border-gray-200 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  View Menu →
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 flex gap-4 flex-wrap">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                >
                  Reconnect Square account
                </button>
                <button
                  onClick={openLocationPicker}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                >
                  Change location
                </button>
                <button
                  onClick={handleForceRefresh}
                  className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                >
                  Re-check connection
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!needsReauth && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                  <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                    Square is required to accept mobile orders. Without it, customers cannot checkout and orders will not reach you.
                  </p>
                </div>
              )}

              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {[
                  "Auto-import your full Square menu (categories, items, modifiers, prices)",
                  "Keep your LoyalCup menu in sync with Square",
                  "Customers pay in the app — orders drop into Square marked “MOBILE” and print at your counter",
                  "Override any item names or prices in LoyalCup without touching Square",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleConnect}
                disabled={connecting || !shopId}
                className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 px-4 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-60"
              >
                {connecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting to Square...
                  </span>
                ) : !shopId ? (
                  "Complete shop setup first"
                ) : needsReauth ? (
                  "Reconnect Square →"
                ) : (
                  "Connect Square →"
                )}
              </button>

              <button
                onClick={handleForceRefresh}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                Already connected? Re-check connection
              </button>

              {!shopId && !shopLoading && (
                <p className="text-xs text-center text-gray-400">
                  You need to{" "}
                  <button
                    className="underline hover:no-underline"
                    onClick={() => navigate("/shop-owner/setup")}
                  >
                    set up your shop
                  </button>{" "}
                  before connecting Square.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Coming soon */}
      <div className="mt-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-xl flex items-center justify-center text-gray-500 text-lg">
            ⌛
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Toast & Clover — Coming Soon</p>
            <p className="text-sm text-gray-400 mt-0.5">More integrations are on the roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
