import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

// pages
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Menu from "./pages/Menu";
import Account from "./pages/Account";
import Login from "./pages/Login";

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

          </Routes>
        </BrowserRouter>
      </AccentProvider>
    </ThemeProvider>
  );
}
