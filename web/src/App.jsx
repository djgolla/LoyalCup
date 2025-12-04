import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// layouts
import MainLayout from "./layout/MainLayout";
import AuthLayout from "./layout/AuthLayout";
import ShopOwnerLayout from "./layout/ShopOwnerLayout";
import WorkerLayout from "./layout/WorkerLayout";
import AdminLayout from "./layout/AdminLayout";

// auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

// customer pages
import Home from "./pages/customer/Home";
import ShopList from "./pages/customer/ShopList";
import ShopDetail from "./pages/customer/ShopDetail";
import Cart from "./pages/customer/Cart";
import OrderHistory from "./pages/customer/OrderHistory";
import Rewards from "./pages/customer/Rewards";
import Profile from "./pages/customer/Profile";

// auth pages
import CustomerLogin from "./pages/auth/CustomerLogin";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";

// shop owner pages
import ShopOwnerDashboard from "./pages/shop-owner/ShopOwnerDashboard";
import MenuBuilder from "./pages/shop-owner/MenuBuilder";

// worker pages
import OrderQueue from "./pages/worker/OrderQueue";

// admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopManagement from "./pages/admin/ShopManagement";

// error pages
import NotFound from "./pages/NotFound";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

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
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* auth pages */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<CustomerLogin />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* admin login (separate, hidden) */}
                <Route path="/admin" element={<AdminLogin />} />

                {/* public customer pages */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shops" element={<ShopList />} />
                  <Route path="/shops/:id" element={<ShopDetail />} />
                </Route>

                {/* protected customer pages */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* shop owner pages */}
                <Route
                  element={
                    <RoleGuard roles={["shop_owner", "admin"]}>
                      <ShopOwnerLayout />
                    </RoleGuard>
                  }
                >
                  <Route path="/shop-owner" element={<ShopOwnerDashboard />} />
                  <Route path="/shop-owner/menu" element={<MenuBuilder />} />
                  <Route path="/shop-owner/categories" element={<div>Categories</div>} />
                  <Route path="/shop-owner/customizations" element={<div>Customizations</div>} />
                  <Route path="/shop-owner/orders" element={<div>Orders</div>} />
                  <Route path="/shop-owner/analytics" element={<div>Analytics</div>} />
                  <Route path="/shop-owner/loyalty" element={<div>Loyalty</div>} />
                  <Route path="/shop-owner/workers" element={<div>Workers</div>} />
                  <Route path="/shop-owner/settings" element={<div>Settings</div>} />
                </Route>

                {/* worker pages */}
                <Route
                  element={
                    <RoleGuard roles={["shop_worker", "admin"]}>
                      <WorkerLayout />
                    </RoleGuard>
                  }
                >
                  <Route path="/worker" element={<OrderQueue />} />
                  <Route path="/worker/summary" element={<div>Daily Summary</div>} />
                </Route>

                {/* admin pages */}
                <Route
                  element={
                    <RoleGuard roles={["admin"]}>
                      <AdminLayout />
                    </RoleGuard>
                  }
                >
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/shops" element={<ShopManagement />} />
                  <Route path="/admin/users" element={<div>User Management</div>} />
                  <Route path="/admin/analytics" element={<div>Platform Analytics</div>} />
                  <Route path="/admin/settings" element={<div>Platform Settings</div>} />
                  <Route path="/admin/audit-log" element={<div>Audit Log</div>} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </AccentProvider>
    </ThemeProvider>
  );
}
