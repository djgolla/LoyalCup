import { createContext, useState, useEffect, useContext, useCallback } from "react";
import supabase from "../lib/supabase";
import { API_V1 } from "../api/client";

export const AuthContext = createContext();

const API_BASE = API_V1;

async function fetchProfile(accessToken) {
  if (!accessToken) return null;

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) return null;
  return res.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncSession = useCallback(async (newSession) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession?.access_token) {
      const p = await fetchProfile(newSession.access_token);
      setProfile(p);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.warn("[Auth] Failed to get session:", error.message);
        }

        if (isMounted) {
          await syncSession(currentSession);
          setLoading(false);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (!isMounted) return;

          await syncSession(newSession);
          setLoading(false);
        });

        authSubscription = subscription;
      } catch (error) {
        console.error("[Auth] Init error:", error);

        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;

      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [syncSession]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await syncSession(data.session);
    return data;
  };

  const signup = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) throw error;
    return data;
  };

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      await syncSession(data.session);
      return data.session;
    } catch (e) {
      console.warn("[Auth] Session refresh failed:", e.message);
      return null;
    }
  }, [syncSession]);

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();

      if (!freshSession?.access_token) {
        setProfile(null);
        return null;
      }

      const p = await fetchProfile(freshSession.access_token);
      setProfile(p);
      return p;
    } catch (e) {
      console.warn("[Auth] Profile refresh failed:", e.message);
      return null;
    }
  }, []);

  const getRole = () => {
    return profile?.role || "customer";
  };

  const hasRole = (roles) => {
    const role = getRole();

    return Array.isArray(roles)
      ? roles.includes(role)
      : role === roles;
  };

  const getRedirectPath = (role) => {
    const userRole = role || getRole();

    switch (userRole) {
      case "admin":
        return "/admin/dashboard";
      case "shop_owner":
        return "/shop-owner/dashboard";
      case "shop_worker":
        return "/worker";
      default:
        return "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        login,
        signup,
        logout,
        signInWithGoogle,
        refreshSession,
        refreshProfile,
        hasRole,
        getRole,
        getRedirectPath,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
