import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ShopOwnerLayout from "./layout/ShopOwnerLayout";

// pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Menu from "./pages/Menu";
import Account from "./pages/Account";
import Login from "./pages/Login";

// shop owner pages
import ShopOwnerDashboard from "./pages/shop-owner/Dashboard";
import MenuBuilder from "./pages/shop-owner/MenuBuilder";
import Categories from "./pages/shop-owner/Categories";
import Customizations from "./pages/shop-owner/Customizations";
import ShopSettings from "./pages/shop-owner/ShopSettings";
import Analytics from "./pages/shop-owner/Analytics";
import Workers from "./pages/shop-owner/Workers";
import LoyaltySettings from "./pages/shop-owner/LoyaltySettings";

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

            {/* main dashboard pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/account" element={<Account />} />
            </Route>

            {/* shop owner portal */}
            <Route path="/shop-owner" element={<ShopOwnerLayout />}>
              <Route index element={<ShopOwnerDashboard />} />
              <Route path="menu-builder" element={<MenuBuilder />} />
              <Route path="categories" element={<Categories />} />
              <Route path="customizations" element={<Customizations />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="workers" element={<Workers />} />
              <Route path="loyalty" element={<LoyaltySettings />} />
              <Route path="settings" element={<ShopSettings />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </AccentProvider>
    </ThemeProvider>
  );
}
