import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(email, password); // REMOVED 3rd param
      toast.success("Welcome back!");
      
      const from = location.state?.from?. pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || "Login failed.  Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-lg border border-gray-200 dark: border-neutral-800"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark: text-white mb-6 text-center">
          Sign In to LoyalCup
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
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
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus: ring-2 focus:ring-amber-700"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-700 text-white py-3 rounded-lg hover:bg-amber-800 transition font-medium"
        >
          Sign In
        </button>

        <div className="mt-4 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-amber-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-700 hover:underline">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}