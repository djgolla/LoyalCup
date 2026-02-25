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
import EditProfile from "./pages/customer/EditProfile";

// auth pages
import CustomerLogin from "./pages/auth/CustomerLogin";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ShopApplication from "./pages/auth/ShopApplication";
import ApplicationPending from "./pages/auth/ApplicationPending";

// shop owner pages
import ShopOwnerDashboard from "./pages/shop-owner/ShopOwnerDashboard";
import MenuBuilder from "./pages/shop-owner/MenuBuilder";
import Categories from "./pages/shop-owner/Categories";
import Customizations from "./pages/shop-owner/Customizations";
import ShopOwnerOrders from "./pages/shop-owner/Orders";
import ShopOwnerAnalytics from "./pages/shop-owner/Analytics";
import LoyaltySettings from "./pages/shop-owner/LoyaltySettings";
import Workers from "./pages/shop-owner/Workers";
import ShopSettings from "./pages/shop-owner/ShopSettings";

// worker pages
import OrderQueue from "./pages/worker/OrderQueue";
import DailySummary from "./pages/worker/DailySummary";

// admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopManagement from "./pages/admin/ShopManagement";
import Users from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AuditLog from "./pages/admin/AuditLog";

// info pages
import Contact from "./pages/info/Contact";
import Privacy from "./pages/info/Privacy";
import Terms from "./pages/info/Terms";
import About from "./pages/info/About";

// error pages
import NotFound from "./pages/NotFound";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ShopProvider } from "./context/ShopContext";

export default function App() {

  return (
    <ThemeProvider>
      <AccentProvider>
        <AuthProvider>
          <ShopProvider>
            <CartProvider>
              <BrowserRouter>
              <Routes>
                {/* auth pages */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<CustomerLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/application-pending" element={<ApplicationPending />} />
                </Route>

                {/* admin login (separate, hidden) */}
                <Route path="/admin" element={<AdminLogin />} />

                {/* protected shop application */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AuthLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/shop-application" element={<ShopApplication />} />
                </Route>

                {/* public customer pages */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shops" element={<ShopList />} />
                  <Route path="/shops/:id" element={<ShopDetail />} />
                  {/* info pages */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/about" element={<About />} />
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
                  <Route path="/profile/edit" element={<EditProfile />} />
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
                  <Route path="/shop-owner/dashboard" element={<ShopOwnerDashboard />} />
                  <Route path="/shop-owner/menu" element={<MenuBuilder />} />
                  <Route path="/shop-owner/categories" element={<Categories />} />
                  <Route path="/shop-owner/customizations" element={<Customizations />} />
                  <Route path="/shop-owner/orders" element={<ShopOwnerOrders />} />
                  <Route path="/shop-owner/analytics" element={<ShopOwnerAnalytics />} />
                  <Route path="/shop-owner/loyalty" element={<LoyaltySettings />} />
                  <Route path="/shop-owner/workers" element={<Workers />} />
                  <Route path="/shop-owner/settings" element={<ShopSettings />} />
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
                  <Route path="/worker/summary" element={<DailySummary />} />
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
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/audit-log" element={<AuditLog />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ShopProvider>
      </AuthProvider>
    </AccentProvider>
  </ThemeProvider>
  );
}
