import supabase from "../lib/supabase";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated. Please log in again.");
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse(res, defaultMsg) {
  if (res.ok) return res.json();
  let err = {};
  try { err = await res.json(); } catch { /* not json */ }
  const message = err.detail || err.message || defaultMsg;
  const error   = new Error(message);
  error.status      = res.status;
  error.needsReauth =
    res.status === 401 && /reconnect|expired|reauth/i.test(message || "");
  throw error;
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
  return handleResponse(res, "Failed to get Square connect URL");
}

/**
 * Get POS connection status for a shop.
 * Returns: { status, provider, shop_id, merchant_id, location_id,
 *            has_location, needs_reauth, last_updated, locations, error }
 */
export async function getPosStatus(shopId, provider = "square") {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/v1/pos/status?provider=${provider}&shop_id=${shopId}`,
    { headers }
  );
  return handleResponse(res, "Failed to get POS status");
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
  return handleResponse(res, "Sync failed");
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
  return handleResponse(res, "Failed to set location");
}