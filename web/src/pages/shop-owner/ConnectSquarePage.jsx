import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  getSquareConnectUrl,
  getPosStatus,
  triggerPosSync,
} from "../../services/posService";

export default function ConnectSquarePage() {
  const { shop, loading: shopLoading } = useShop();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posStatus, setPosStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  const callbackStatus = searchParams.get("status");
  const callbackSynced = searchParams.get("synced");
  const callbackItems = searchParams.get("items");

  const shopId = shop?.id;

  const loadStatus = useCallback(async () => {
    if (!shopId) return;
    try {
      setLoadingStatus(true);
      const data = await getPosStatus(shopId, "square");
      setPosStatus(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingStatus(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopLoading && shopId) {
      loadStatus();
    }
  }, [shopId, shopLoading, loadStatus]);

  useEffect(() => {
    if (callbackStatus === "connected") {
      setSyncResult({
        status: "connected",
        synced: callbackSynced,
        items: callbackItems,
      });
      window.history.replaceState({}, "", "/shop-owner/connect-square");
      setTimeout(loadStatus, 1000);
    }
  }, [callbackStatus, callbackSynced, callbackItems, loadStatus]);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const { authorization_url } = await getSquareConnectUrl();
      window.location.href = authorization_url;
    } catch (e) {
      setError(e.message);
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
      setSyncResult(result);
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = posStatus?.status === "connected";

  // Show a neutral loading state while shop context initialises
  const statusLabel = shopLoading || loadingStatus
    ? "Loading..."
    : isConnected
    ? null   // badge rendered below
    : null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/shop-owner/settings")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          ← Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-gray-900">POS Integration</h1>
        <p className="text-gray-500 mt-1">
          Connect your Square account to automatically import your menu and
          process payments through your existing POS.
        </p>
      </div>

      {/* OAuth callback success banner */}
      {syncResult?.status === "connected" && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <span className="text-green-500 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-green-800">Square Connected!</p>
            {syncResult.synced === "true" && (
              <p className="text-green-700 text-sm mt-0.5">
                {syncResult.items || 0} menu items imported from Square. Head to{" "}
                <button
                  className="underline font-medium"
                  onClick={() => navigate("/shop-owner/menu")}
                >
                  Menu Builder
                </button>{" "}
                to review and customize.
              </p>
            )}
            {syncResult.synced === "partial" && (
              <p className="text-yellow-700 text-sm mt-0.5">
                Connection saved but menu sync had an issue. Use Sync below to retry.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Manual sync result banner */}
      {syncResult?.status === "success" && (
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <p className="font-semibold text-blue-800">Sync Complete</p>
          <p className="text-blue-700 text-sm mt-1">
            {syncResult.synced?.categories_synced || 0} categories,{" "}
            {syncResult.synced?.items_synced || 0} items,{" "}
            {syncResult.synced?.modifier_groups_synced || 0} modifier groups updated.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="font-semibold text-red-800">Something went wrong</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Square card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg">
            ■
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Square</h2>
            <p className="text-sm text-gray-500">
              Import menu, sync inventory, process payments
            </p>
          </div>
          {/* Status badge */}
          {shopLoading || loadingStatus ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : isConnected ? (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              Connected
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
              Not connected
            </span>
          )}
        </div>

        <div className="p-6">
          {/* Still loading shop context — don't show "complete setup first" prematurely */}
          {shopLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Loading your shop...
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Merchant ID</span>
                  <span className="font-mono text-gray-700 text-xs">
                    {posStatus.merchant_id || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-700">
                    {posStatus.location_id ? (
                      <span className="text-green-600 font-medium">Set ✓</span>
                    ) : (
                      <span className="text-yellow-600">Not set</span>
                    )}
                  </span>
                </div>
                {posStatus.last_updated && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last updated</span>
                    <span className="text-gray-700 text-xs">
                      {new Date(posStatus.last_updated).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 bg-black text-white rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </span>
                  ) : (
                    "↻ Sync Menu from Square"
                  )}
                </button>
                <button
                  onClick={() => navigate("/shop-owner/menu")}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 px-4 font-medium text-sm hover:bg-gray-50 transition"
                >
                  View Menu →
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  Reconnect Square account
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  "Auto-import your full Square menu (categories, items, modifiers, prices)",
                  "Keep your LoyalCup menu in sync with Square",
                  "Process payments through your Square terminal",
                  "Override any item names or prices in LoyalCup without touching Square",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleConnect}
                disabled={connecting || !shopId}
                className="w-full bg-black text-white rounded-xl py-3 px-4 font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirecting to Square...
                  </span>
                ) : !shopId ? (
                  "Complete shop setup first"
                ) : (
                  "Connect Square →"
                )}
              </button>

              {!shopId && (
                <p className="text-xs text-center text-gray-400">
                  You need to{" "}
                  <button
                    className="underline"
                    onClick={() => navigate("/shop-owner/setup")}
                  >
                    set up your shop
                  </button>{" "}
                  before connecting a POS.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Coming soon */}
      <div className="mt-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 text-lg">
            ⌛
          </div>
          <div>
            <p className="font-medium text-gray-700">Toast & Clover — Coming Soon</p>
            <p className="text-sm text-gray-400 mt-0.5">More integrations are on the roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}