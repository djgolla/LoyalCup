/**
 * Auth API functions for communicating with backend auth endpoints.
 */
import supabase from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Register a new user
 */
export async function registerUser(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'customer'
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Login user with email and password
 */
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  
  // Fetch user profile from backend
  if (data.session) {
    const profile = await getUserProfile(data.session.access_token);
    return { ...data, profile };
  }
  
  return data;
}

/**
 * Logout current user
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return data.session;
}

/**
 * Get user profile from backend
 */
export async function getUserProfile(accessToken) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

/**
 * Update user profile
 */
export async function updateUserProfile(accessToken, updates) {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) throw error;
}

/**
 * Reset password with new password
 */
export async function resetPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
