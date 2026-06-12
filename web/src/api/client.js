const rawApiOrigin =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const trimmedApiOrigin = rawApiOrigin.replace(/\/$/, "");

export const API_ORIGIN =
  trimmedApiOrigin.startsWith("http://") &&
  !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(trimmedApiOrigin)
    ? trimmedApiOrigin.replace(/^http:\/\//i, "https://")
    : trimmedApiOrigin;
export const API_V1 = API_ORIGIN ? `${API_ORIGIN}/api/v1` : "/api/v1";

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
}

export async function parseJsonResponse(response) {
  const text = await response.text();
  const data = text ? tryParseJson(text) : {};

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (data === null) {
    throw new Error("Backend returned a non-JSON response");
  }

  return data;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
