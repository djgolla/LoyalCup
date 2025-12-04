import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // check for existing session
    const initAuth = () => {
      const storedUser = localStorage.getItem("loyalcup_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch {
          localStorage.removeItem("loyalcup_user");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, role = "customer") => {
    // simulate login - in real app would call Supabase
    const mockUser = {
      id: "mock-id-" + Date.now(),
      email,
      role,
      full_name: email.split("@")[0],
    };
    
    setUser(mockUser);
    localStorage.setItem("loyalcup_user", JSON.stringify(mockUser));
    return mockUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("loyalcup_user");
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const getRedirectPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "shop_owner":
        return "/shop-owner";
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
        loading,
        login,
        logout,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
