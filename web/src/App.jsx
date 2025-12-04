import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import WorkerLayout from "./layout/WorkerLayout";

// existing pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Menu from "./pages/Menu";
import Account from "./pages/Account";
import Login from "./pages/Login";

// customer pages
import Home from "./pages/customer/Home";
import ShopDetail from "./pages/customer/ShopDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import OrderTracking from "./pages/customer/OrderTracking";

// worker pages
import OrderQueue from "./pages/worker/OrderQueue";

// contexts
import { ThemeProvider } from "./context/ThemeContext";
import { AccentProvider } from "./context/AccentContext";
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
        <CartProvider>
          <BrowserRouter>
            <Routes>

              {/* login */}
              <Route path="/login" element={<Login />} />

              {/* customer routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop/:shopId" element={<ShopDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/order-tracking/:orderId" element={<OrderTracking />} />

              {/* worker routes */}
              <Route element={<WorkerLayout />}>
                <Route path="/worker/queue/:shopId" element={<OrderQueue />} />
              </Route>

              {/* main dashboard pages (existing) */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/account" element={<Account />} />
              </Route>

            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AccentProvider>
    </ThemeProvider>
  );
}
