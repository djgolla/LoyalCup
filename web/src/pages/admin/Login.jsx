// Admin login page
// Separate secure login for admin access

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Simple validation for demo
    if (email === "admin@loyalcup.com" && password === "admin") {
      toast.success("Admin login successful");
      navigate("/admin");
    } else {
      toast.error("Invalid admin credentials");
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-neutral-950">
      <form
        onSubmit={handleLogin}
        className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-8 h-8 text-amber-500" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Admin Access</h1>
            <p className="text-sm text-gray-400">LoyalCup Platform Control</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@loyalcup.com"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none focus:border-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-black py-2.5 rounded-lg font-medium hover:bg-amber-600 transition"
          >
            Login to Admin Panel
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center">
          This area is restricted to authorized administrators only.
        </p>
      </form>
    </div>
  );
}
