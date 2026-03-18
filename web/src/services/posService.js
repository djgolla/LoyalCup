import supabase from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getSquareConnectUrl() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/connect?provider=square`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get Square connect URL");
  }
  return res.json();
}

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

export async function triggerPosSync(shopId, provider = "square") {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ shop_id: shopId, provider }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Sync failed");
  }
  return res.json();
}

export async function setSquareLocation(shopId, locationId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/v1/pos/square/set-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ shop_id: shopId, location_id: locationId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to set location");
  }
  return res.json();
}