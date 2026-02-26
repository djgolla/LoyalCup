import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import AuthLayout from "./layout/AuthLayout";
import ShopOwnerLayout from "./layout/ShopOwnerLayout";
import WorkerLayout from "./layout/WorkerLayout";
import AdminLayout from "./layout/AdminLayout";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleGuard from "./components/auth/RoleGuard";

import Home from "./pages/customer/Home";
import Download from "./pages/customer/Download";
import ShopList from "./pages/customer/ShopList";
import ShopDetail from "./pages/customer/ShopDetail";
import Rewards from "./pages/customer/Rewards";
import Profile from "./pages/customer/Profile";
import EditProfile from "./pages/customer/EditProfile";

import CustomerLogin from "./pages/auth/CustomerLogin";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";
import ShopApplication from "./pages/auth/ShopApplication";
import ApplicationPending from "./pages/auth/ApplicationPending";

import ShopOwnerDashboard from "./pages/shop-owner/ShopOwnerDashboard";
import MenuBuilder from "./pages/shop-owner/MenuBuilder";
import Categories from "./pages/shop-owner/Categories";
import Customizations from "./pages/shop-owner/Customizations";
import ShopOwnerOrders from "./pages/shop-owner/Orders";
import ShopOwnerAnalytics from "./pages/shop-owner/Analytics";
import LoyaltySettings from "./pages/shop-owner/LoyaltySettings";
import Workers from "./pages/shop-owner/Workers";
import ShopSettings from "./pages/shop-owner/ShopSettings";

import OrderQueue from "./pages/worker/OrderQueue";
import DailySummary from "./pages/worker/DailySummary";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ShopManagement from "./pages/admin/ShopManagement";
import Users from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AuditLog from "./pages/admin/AuditLog";

import Contact from "./pages/info/Contact";
import Privacy from "./pages/info/Privacy";
import Terms from "./pages/info/Terms";
import About from "./pages/info/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<Download />} />
          <Route path="/shops" element={<ShopList />} />
          <Route path="/shops/:id" element={<ShopDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          <Route 
            path="/rewards" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['customer']}>
                  <Rewards />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['customer']}>
                  <Profile />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['customer']}>
                  <EditProfile />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/shop-application" element={<ShopApplication />} />
          <Route path="/application-pending" element={<ApplicationPending />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['shop_owner']}>
                <ShopOwnerLayout />
              </RoleGuard>
            </ProtectedRoute>
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
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['shop_worker']}>
                <WorkerLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/worker" element={<OrderQueue />} />
          <Route path="/worker/summary" element={<DailySummary />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/shops" element={<ShopManagement />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/audit" element={<AuditLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;