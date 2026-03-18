/**
 * Minimal API client for talking to the LoyalCup FastAPI backend.
 * Reads EXPO_PUBLIC_API_URL from your .env (e.g. http://localhost:8000)
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  async post(path, body, token) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.detail || data?.message || `Request failed: ${response.status}`;
      throw new Error(message);
    }

    return data;
  },

  async get(path, token) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.detail || data?.message || `Request failed: ${response.status}`;
      throw new Error(message);
    }

    return data;
  },
};