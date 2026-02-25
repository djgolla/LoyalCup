import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { user } = await login(email, password); // REMOVED 3rd param
      
      // Check if user has admin role
      if (user?. user_metadata?.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        return;
      }
      
      toast. success("Admin access granted");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-amber-500 mb-2">
              Admin Panel
            </h1>
            <p className="text-slate-400 text-sm">LoyalCup Platform</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-500 border border-slate-700"
              placeholder="admin@loyalcup.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target. value)}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg outline-none focus:ring-2 focus: ring-amber-500 border border-slate-700"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-medium"
          >
            Access Admin Panel
          </button>

          <div className="mt-6 text-center text-xs text-slate-500">
            Unauthorized access is prohibited
          </div>
        </form>
      </div>
    </div>
  );
}