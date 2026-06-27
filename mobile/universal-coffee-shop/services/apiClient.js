/**
 * Thin API client for LoyalCup backend.
 * All requests attach the Supabase JWT as a Bearer token when available.
 */
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

const RAW_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8000';

const BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

async function request(method, path, body, token) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${cleanPath}`;

  const headers = { 'Content-Type': 'application/json' };

  let authToken = token;
  if (!authToken) {
    const { data: { session } } = await supabase.auth.getSession();
    authToken = session?.access_token || null;
  }

  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[apiClient] request:', method, url);
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[apiClient] error:', {
        method,
        url,
        status: res.status,
        response: data,
      });
    }

    const msg = data?.detail || data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }

  return data;
}

export const apiClient = {
  get: (path, token) => request('GET', path, null, token),
  post: (path, body, token) => request('POST', path, body, token),
  put: (path, body, token) => request('PUT', path, body, token),
  patch: (path, body, token) => request('PATCH', path, body, token),
  delete: (path, token) => request('DELETE', path, null, token),
};
