import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./layout/AdminLayout";

// pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Menu from "./pages/Menu";
import Account from "./pages/Account";
import Login from "./pages/Login";

// admin pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminShops from "./pages/admin/Shops";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminAuditLog from "./pages/admin/AuditLog";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";

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
        <BrowserRouter>
          <Routes>

            {/* login */}
            <Route path="/login" element={<Login />} />

            {/* admin login - hidden route */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* main dashboard pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/account" element={<Account />} />
            </Route>

            {/* admin pages - hidden from regular users */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="shops" element={<AdminShops />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="audit-log" element={<AdminAuditLog />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </AccentProvider>
    </ThemeProvider>
  );
}
