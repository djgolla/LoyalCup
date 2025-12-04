import { createContext, useState, useEffect, useContext } from 'react';
import {
  loginUser,
  logoutUser,
  registerUser,
  getSession,
  getUserProfile,
  onAuthStateChange
} from '../lib/auth';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const userProfile = await getUserProfile(session.access_token);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function initializeAuth() {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        const userProfile = await getUserProfile(currentSession.access_token);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      setUser(data.user);
      setSession(data.session);
      setProfile(data.profile);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(email, password, fullName) {
    setIsLoading(true);
    try {
      const data = await registerUser(email, password, fullName);
      setUser(data.user);
      setSession(data.session);
      // Profile will be fetched by auth state change listener
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Computed properties for role-based access
  const isAdmin = profile?.role === 'admin';
  const isShopOwner = profile?.role === 'shop_owner';
  const isShopWorker = profile?.role === 'shop_worker';
  const isCustomer = profile?.role === 'customer';

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    isAdmin,
    isShopOwner,
    isShopWorker,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
