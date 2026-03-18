import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Coffee, Smartphone } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(email, password);
      toast.success("Welcome back!");
      const role = user?.user_metadata?.role;
      if (role === "admin")      navigate("/admin/dashboard");
      else if (role === "shop_owner") navigate("/shop-owner/dashboard");
      else {
        // customers don't belong here
        toast.info("LoyalCup for customers is on the mobile app.");
        navigate("/download");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
          <Coffee className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shop Owner Portal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Sign in to manage your shop
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-neutral-800"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Want to list your shop?{" "}
          <Link to="/shop-application" className="text-amber-600 hover:underline font-medium">
            Apply here
          </Link>
        </div>
      </form>

      {/* Customer redirect callout */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-center">
        <Smartphone className="w-6 h-6 text-amber-600 mx-auto mb-2" />
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
          Looking to order coffee?
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 mb-3">
          The LoyalCup customer experience is on mobile.
        </p>
        <Link
          to="/download"
          className="inline-block px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition"
        >
          Download the App
        </Link>
      </div>
    </div>
  );
}