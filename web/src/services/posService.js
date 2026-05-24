import supabase from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated. Please log in again.");
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get the Square OAuth authorization URL (kicks off OAuth flow).
 */
export async function getSquareConnectUrl() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/connect?provider=square`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get Square connect URL");
  }
  return res.json();
}

/**
 * Get POS connection status + live locations list for a shop.
 */
export async function getPosStatus(shopId, provider = "square") {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/v1/pos/status?provider=${provider}&shop_id=${shopId}`,
    { headers }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get POS status");
  }
  return res.json();
}

/**
 * Trigger a manual menu sync from Square.
 */
export async function triggerPosSync(shopId, provider = "square") {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/sync`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body:    JSON.stringify({ shop_id: shopId, provider }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Sync failed");
  }
  return res.json();
}

/**
 * Set the active Square location for payment processing.
 */
export async function setSquareLocation(shopId, locationId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/square/set-location`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body:    JSON.stringify({ shop_id: shopId, location_id: locationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to set location");
  }
  return res.json();
}

/**
 * Check if a shop's Square integration is fully ready for payments.
 * Returns { ready: bool, connected: bool, hasLocation: bool }
 */
export async function getSquareReadiness(shopId) {
  try {
    const status = await getPosStatus(shopId, "square");
    const connected   = status.status === "connected";
    const hasLocation = !!status.location_id;
    return {
      ready:       connected && hasLocation,
      connected,
      hasLocation,
      locations:   status.locations || [],
      merchantId:  status.merchant_id,
      locationId:  status.location_id,
    };
  } catch {
    return { ready: false, connected: false, hasLocation: false, locations: [] };
  }
}