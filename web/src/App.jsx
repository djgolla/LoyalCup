import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// layouts
import MainLayout from "./layout/MainLayout";
import AuthLayout from "./layout/AuthLayout";
import ShopOwnerLayout from "./layout/ShopOwnerLayout";
import AdminLayout from "./layout/AdminLayout";

// auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

// public pages
import Home from "./pages/customer/Home";
import Download from "./pages/Download";

// auth pages
import Login from "./pages/auth/Login";
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
import ShopSetup from "./pages/shop-owner/ShopSetup";
import ConnectSquarePage from "./pages/shop-owner/ConnectSquarePage";
import Reviews from './pages/shop-owner/Reviews';

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
import Pricing from "./pages/info/Pricing";

// error pages
import NotFound from "./pages/NotFound";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
import { AuthProvider } from "./context/AuthContext";
import { ShopProvider } from "./context/ShopContext";
import PageLoader from "./components/ui/PageLoader";

function RoleRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    const role = user.user_metadata?.role;
    if (role === "shop_owner") return <Navigate to="/shop-owner/dashboard" replace />;
    if (role === "admin")      return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AccentProvider>
        <AuthProvider>
          <ShopProvider>
            <BrowserRouter>
              <Routes>
                {/* public pages */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<RoleRedirect><Home /></RoleRedirect>} />
                  <Route path="/download" element={<Download />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/pricing" element={<Pricing />} />
                </Route>

                {/* auth pages */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/application-pending" element={<ApplicationPending />} />
                </Route>

                {/* hidden admin login */}
                <Route path="/admin" element={<AdminLogin />} />

                {/* shop application — public */}
                <Route element={<MainLayout />}>
                  <Route path="/shop-application" element={<ShopApplication />} />
                </Route>

                {/* shop owner pages */}
                <Route
                  element={
                    <RoleGuard roles={["shop_owner", "admin"]}>
                      <ShopOwnerLayout />
                    </RoleGuard>
                  }
                >
                  <Route path="/shop-owner/dashboard" element={<ShopOwnerDashboard />} />
                  <Route path="/shop-owner/menu" element={<MenuBuilder />} />
                  <Route path="/shop-owner/categories" element={<Categories />} />
                  <Route path="/shop-owner/customizations" element={<Customizations />} />
                  <Route path="/shop-owner/orders" element={<ShopOwnerOrders />} />
                  <Route path="/shop-owner/analytics" element={<ShopOwnerAnalytics />} />
                  <Route path="/shop-owner/loyalty" element={<LoyaltySettings />} />
                  <Route path="/shop-owner/workers" element={<Workers />} />
                  <Route path="/shop-owner/settings" element={<ShopSettings />} />
                  <Route path="/shop-owner/setup" element={<ShopSetup />} />
                  <Route path="/shop-owner/connect-square" element={<ConnectSquarePage />} />
                  <Route path="/shop-owner/reviews" element={<Reviews />} />
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

                {/* redirects */}
                <Route path="/shops" element={<Navigate to="/download" replace />} />
                <Route path="/shops/:id" element={<Navigate to="/download" replace />} />
                <Route path="/rewards" element={<Navigate to="/download" replace />} />
                <Route path="/profile" element={<Navigate to="/download" replace />} />
                <Route path="/profile/edit" element={<Navigate to="/download" replace />} />
                <Route path="/register" element={<Navigate to="/download" replace />} />
                <Route path="/worker" element={<Navigate to="/login" replace />} />
                <Route path="/worker/summary" element={<Navigate to="/login" replace />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ShopProvider>
        </AuthProvider>
      </AccentProvider>
    </ThemeProvider>
  );
}