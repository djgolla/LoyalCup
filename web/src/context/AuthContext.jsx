import { createContext, useState, useEffect, useContext, useCallback } from "react";
import supabase from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: metadata },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
    return data;
  };

  /**
   * Force-refresh the JWT — call after subscription activates so shop_owner
   * role is live immediately without logout/login.
   */
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      return data.session;
    } catch (e) {
      console.warn('[Auth] Session refresh failed:', e.message);
      return null;
    }
  }, []);

  const hasRole = (roles) => {
    if (!user) return false;
    const userRole = user.user_metadata?.role || 'customer';
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  };

  const getRedirectPath = (role) => {
    const userRole = role || user?.user_metadata?.role || 'customer';
    switch (userRole) {
      case "admin":       return "/admin/dashboard";
      case "shop_owner":  return "/shop-owner/dashboard";
      case "shop_worker": return "/worker";
      default:            return "/";
    }
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}