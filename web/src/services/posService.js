import supabase from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
 * Get POS connection status for a shop.
 * Returns: { status, connected, location_id, merchant_id, last_updated }
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
 * Full Square readiness check — used by the dashboard setup card.
 * Calls /readiness which returns connected + hasLocation + locations list.
 */
export async function getSquareReadiness(shopId) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(
      `${API_BASE}/api/v1/pos/readiness?shop_id=${shopId}`,
      { headers }
    );
    if (!res.ok) throw new Error("Readiness check failed");
    const data = await res.json();
    return {
      ready:      data.ready,
      connected:  data.connected,
      hasLocation: data.hasLocation,
      locations:  data.locations || [],
      merchantId: data.merchantId,
    };
  } catch {
    return { ready: false, connected: false, hasLocation: false, locations: [] };
  }
}