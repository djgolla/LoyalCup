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

export default function ConnectSquarePage() {
  const { shop, loading: shopLoading, loadShop } = useShop();
  const [searchParams]     = useSearchParams();
  const navigate           = useNavigate();

  const [posStatus,        setPosStatus]        = useState(null);
  const [loadingStatus,    setLoadingStatus]    = useState(false);
  const [connecting,       setConnecting]       = useState(false);
  const [syncing,          setSyncing]          = useState(false);
  const [syncResult,       setSyncResult]       = useState(null);
  const [error,            setError]            = useState(null);
  const [locations,        setLocations]        = useState(null);
  const [settingLocation,  setSettingLocation]  = useState(false);

  const callbackStatus     = searchParams.get("status");
  const callbackSynced     = searchParams.get("synced");
  const callbackItems      = searchParams.get("items");
  const callbackError      = searchParams.get("reason");
  const needsLocation      = searchParams.get("needs_location") === "true";
  const callbackLocationId = searchParams.get("location_id");

  const shopId = shop?.id;

  const loadStatus = useCallback(async () => {
    if (!shopId) return;
    try {
      setLoadingStatus(true);
      const data = await getPosStatus(shopId, "square");
      setPosStatus(data);
    } catch {
      setPosStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopLoading && shopId) loadStatus();
  }, [shopId, shopLoading, loadStatus]);

  useEffect(() => {
    if (!callbackStatus) return;

    if (callbackStatus === "connected") {
      setSyncResult({ status: "connected", synced: callbackSynced, items: callbackItems });
      if (needsLocation) {
        fetchLocations();
      } else if (callbackLocationId) {
        toast.success("Square connected and location set!");
      } else {
        toast.success("Square connected!");
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
    }

    window.history.replaceState({}, "", "/shop-owner/connect-square");
  }, [callbackStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLocations = async () => {
    try {
      const data = await getPosStatus(shopId, "square");
      if (data?.locations && data.locations.length > 0) {
        setLocations(data.locations);
      }
    } catch (e) {
      console.warn("Could not fetch locations:", e);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { authorization_url } = await getSquareConnectUrl();
      window.location.href = authorization_url;
    } catch (e) {
      setError(e.message || "Failed to start Square connection. Check your server config.");
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!shopId) return;
    setError(null);
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await triggerPosSync(shopId, "square");
      setSyncResult({ status: "success", synced: result });
      toast.success(`Sync complete! ${result.items_synced || 0} items updated.`);
      await loadStatus();
    } catch (e) {
      setError(e.message || "Sync failed. Please try again.");
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleSetLocation = async (locationId) => {
    if (!shopId) return;
    setSettingLocation(true);
    try {
      await setSquareLocation(shopId, locationId);
      setLocations(null);
      await loadStatus();
      await loadShop();
      toast.success("Square location set! You're ready to accept orders.");
    } catch (e) {
      setError(e.message || "Failed to set location.");
      toast.error("Failed to set location");
    } finally {
      setSettingLocation(false);
    }
  };

  const isConnected = posStatus?.status === "connected";

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
          Square is <strong>required</strong> to accept mobile orders. Orders go directly to your Square terminal.
        </p>
      </div>

      {/* Success banner */}
      {syncResult?.status === "connected" && (
        <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
          <span className="text-green-500 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Square Connected!</p>
            {syncResult.synced === "true" && (
              <p className="text-green-700 dark:text-green-400 text-sm mt-0.5">
                {syncResult.items || 0} menu items imported.{" "}
                <button className="underline font-medium" onClick={() => navigate("/shop-owner/menu")}>
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
            {syncResult.synced?.categories_synced || 0} categories,{" "}
            {syncResult.synced?.items_synced || 0} items,{" "}
            {syncResult.synced?.modifier_groups_synced || 0} modifier groups updated.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Something went wrong</p>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-0.5">×</button>
        </div>
      )}

      {/* Location picker */}
      {locations && locations.length > 0 && (
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
                className="w-full flex items-center justify-between text-left px-4 py-3 bg-white dark:bg-neutral-800 rounded-lg border border-amber-200 dark:border-amber-700 hover:border-amber-500 dark:hover:border-amber-500 transition disabled:opacity-50"
              >
                <span className="font-medium text-gray-900 dark:text-white">{loc.name}</span>
                <span className="text-xs text-gray-400 font-mono">{loc.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Square card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-neutral-700">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">■</div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 dark:text-white">Square</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Required · Import menu · sync inventory · process payments</p>
          </div>
          {shopLoading || loadingStatus ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : isConnected ? (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">Connected</span>
          ) : (
            <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1 rounded-full">Required</span>
          )}
        </div>

        <div className="p-6">
          {shopLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Loading your shop...
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Merchant ID</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">{posStatus?.merchant_id || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  {posStatus?.location_id ? (
                    <span className="text-green-600 dark:text-green-400 font-medium text-xs">Set ✓</span>
                  ) : (
                    <button onClick={fetchLocations} className="text-amber-600 hover:text-amber-700 text-xs font-semibold underline">
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
                    <span className="text-gray-700 dark:text-gray-300 text-xs">{new Date(posStatus.last_updated).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {syncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </span>
                  ) : "↻ Sync Menu from Square"}
                </button>
                <button
                  onClick={() => navigate("/shop-owner/menu")}
                  className="flex-1 border border-gray-200 dark:border-neutral-600 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  View Menu →
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 flex gap-4">
                <button onClick={handleConnect} disabled={connecting} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">
                  Reconnect Square account
                </button>
                <button onClick={fetchLocations} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">
                  Change location
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Required warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Square is required to accept mobile orders. Without it, customers cannot checkout and orders will not reach you.
                </p>
              </div>

              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {[
                  "Auto-import your full Square menu (categories, items, modifiers, prices)",
                  "Keep your LoyalCup menu in sync with Square",
                  "Customers pay through the app — orders appear on your Square terminal",
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
                className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl py-3 px-4 font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting to Square...
                  </span>
                ) : !shopId ? "Complete shop setup first" : "Connect Square →"}
              </button>

              {!shopId && !shopLoading && (
                <p className="text-xs text-center text-gray-400">
                  You need to{" "}
                  <button className="underline" onClick={() => navigate("/shop-owner/setup")}>set up your shop</button>{" "}
                  before connecting Square.
                </p>
              )}
              {/* REMOVED: "Skip for now" button — Square is required, not optional */}
            </div>
          )}
        </div>
      </div>

      {/* Coming soon */}
      <div className="mt-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-xl flex items-center justify-center text-gray-500 text-lg">⌛</div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">Toast & Clover — Coming Soon</p>
            <p className="text-sm text-gray-400 mt-0.5">More integrations are on the roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}