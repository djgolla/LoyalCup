import { createContext, useState, useEffect, useContext, useCallback } from "react";
import supabase from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!isMounted) return;

          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        });

        authSubscription = subscription;
      } catch (error) {
        console.error("[Auth] Init error:", error);

        if (isMounted) {
          setSession(null);
          setUser(null);
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
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
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

      setSession(data.session);
      setUser(data.session?.user ?? null);

      return data.session;
    } catch (e) {
      console.warn("[Auth] Session refresh failed:", e.message);
      return null;
    }
  }, []);

  const hasRole = (roles) => {
    if (!user) return false;

    const userRole = user.user_metadata?.role || "customer";

    return Array.isArray(roles)
      ? roles.includes(userRole)
      : userRole === roles;
  };

  const getRedirectPath = (role) => {
    const userRole = role || user?.user_metadata?.role || "customer";

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
        session,
        loading,
        login,
        signup,
        logout,
        signInWithGoogle,
        refreshSession,
        hasRole,
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