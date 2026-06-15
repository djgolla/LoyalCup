import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// layouts
import MainLayout    from "./layout/MainLayout";
import AuthLayout    from "./layout/AuthLayout";
import ShopOwnerLayout from "./layout/ShopOwnerLayout";

// auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard      from "./components/auth/RoleGuard";
import ScrollToTop    from "./components/ui/ScrollToTop";

// public pages
import Home     from "./pages/customer/Home";
import Download from "./pages/Download";

// auth pages
import Login           from "./pages/auth/Login";
import ResetPassword   from "./pages/auth/ResetPassword";
import ShopApplication from "./pages/auth/ShopApplication";

// shop owner pages
import ShopOwnerDashboard  from "./pages/shop-owner/ShopOwnerDashboard";
import MenuBuilder         from "./pages/shop-owner/MenuBuilder";
import Categories          from "./pages/shop-owner/Categories";
import Customizations      from "./pages/shop-owner/Customizations";
import ShopOwnerOrders     from "./pages/shop-owner/Orders";
import ShopOwnerAnalytics  from "./pages/shop-owner/Analytics";
import LoyaltySettings     from "./pages/shop-owner/LoyaltySettings";
import ShopSettings        from "./pages/shop-owner/ShopSettings";
import ConnectSquarePage   from "./pages/shop-owner/ConnectSquarePage";
import Reviews             from './pages/shop-owner/Reviews';
import Subscribe           from './pages/shop-owner/Subscribe';

// info pages
import Contact       from "./pages/info/Contact";
import Privacy       from "./pages/info/Privacy";
import Terms         from "./pages/info/Terms";
import About         from "./pages/info/About";
import Pricing       from "./pages/info/Pricing";
import DeleteAccount from "./pages/info/DeleteAccount";

// error pages
import NotFound from "./pages/NotFound";

// contexts
import { ThemeProvider }  from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
import { AuthProvider }   from "./context/AuthContext";
import { ShopProvider }   from "./context/ShopContext";
import PageLoader         from "./components/ui/PageLoader";

function RoleRedirect({ children }) {
  const { user, loading, getRole } = useAuth();
  const location = useLocation();
  
  // Don't redirect on reset-password page
  if (location.pathname === '/reset-password') {
    return children;
  }
  
  // Wait for auth to load
  if (loading) return <PageLoader />;
  
  // Don't redirect if user just has a session (might be from reset link)
  if (user && location.pathname === '/') {
    const role = getRole();
    if (role === "shop_owner") return <Navigate to="/shop-owner/dashboard" replace />;
    if (role === "admin") return <Navigate to="/" replace />;
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
              <ScrollToTop />
              <Routes>
                {/* public pages */}
                <Route element={<MainLayout />}>
                  <Route path="/"               element={<RoleRedirect><Home /></RoleRedirect>} />
                  <Route path="/download"       element={<Download />} />
                  <Route path="/contact"        element={<Contact />} />
                  <Route path="/privacy"        element={<Privacy />} />
                  <Route path="/terms"          element={<Terms />} />
                  <Route path="/about"          element={<About />} />
                  <Route path="/pricing"        element={<Pricing />} />
                  <Route path="/delete-account" element={<DeleteAccount />} />
                </Route>

                {/* auth pages */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/application-pending" element={<Navigate to="/shop-owner/subscribe" replace />} />
                </Route>

                {/* shop application — public */}
                <Route element={<MainLayout />}>
                  <Route path="/shop-application" element={<ShopApplication />} />
                </Route>

                {/* shop owner pages */}
                <Route
                  element={
                    <RoleGuard roles={["shop_owner", "admin", "applicant"]}>
                      <ShopOwnerLayout />
                    </RoleGuard>
                  }
                >
                  <Route path="/shop-owner/subscribe"      element={<Subscribe />} />
                  <Route path="/shop-owner/dashboard"      element={<ShopOwnerDashboard />} />
                  <Route path="/shop-owner/menu"           element={<MenuBuilder />} />
                  <Route path="/shop-owner/categories"     element={<Categories />} />
                  <Route path="/shop-owner/customizations" element={<Customizations />} />
                  <Route path="/shop-owner/orders"         element={<ShopOwnerOrders />} />
                  <Route path="/shop-owner/analytics"      element={<ShopOwnerAnalytics />} />
                  <Route path="/shop-owner/loyalty"        element={<LoyaltySettings />} />
                  <Route path="/shop-owner/settings"       element={<ShopSettings />} />
                  <Route path="/shop-owner/connect-square" element={<ConnectSquarePage />} />
                  <Route path="/shop-owner/reviews"        element={<Reviews />} />
                </Route>

                {/* old admin routes → home */}
                <Route path="/admin"           element={<Navigate to="/" replace />} />
                <Route path="/admin/*"         element={<Navigate to="/" replace />} />

                {/* customer/order routes → app download */}
                <Route path="/shops"          element={<Navigate to="/download" replace />} />
                <Route path="/shops/:id"      element={<Navigate to="/download" replace />} />
                <Route path="/rewards"        element={<Navigate to="/download" replace />} />
                <Route path="/profile"        element={<Navigate to="/download" replace />} />
                <Route path="/profile/edit"   element={<Navigate to="/download" replace />} />
                <Route path="/register"       element={<Navigate to="/download" replace />} />
                <Route path="/orders"         element={<Navigate to="/download" replace />} />
                <Route path="/orders/:id"     element={<Navigate to="/download" replace />} />
                <Route path="/menu"           element={<Navigate to="/download" replace />} />
                <Route path="/menu/:id"       element={<Navigate to="/download" replace />} />
                <Route path="/worker"         element={<Navigate to="/login" replace />} />
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