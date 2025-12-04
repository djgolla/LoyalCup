import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

// pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Menu from "./pages/Menu";
import Account from "./pages/Account";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
import { AuthProvider } from "./context/AuthContext";

// components
import ProtectedRoute from "./components/auth/ProtectedRoute";

// fake backend
import makeServer from "./api/server";

export default function App() {

  useEffect(() => {
    // init fake backend
    makeServer({ environment: "development" });
  }, []);

  return (
    <ThemeProvider>
      <AccentProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>

              {/* Public auth routes */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected main dashboard pages */}
              <Route element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/account" element={<Account />} />
              </Route>

            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AccentProvider>
    </ThemeProvider>
  );
}
