import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signup(email, password, { full_name: fullName, role });
      toast.success("Account created successfully!");
      
      // If user selected shop owner, redirect to application form
      if (role === "shop_owner") {
        navigate("/shop-application");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Create Account
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            I want to
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-amber-700 transition">
              <input
                type="radio"
                name="role"
                value="customer"
                checked={role === "customer"}
                onChange={(e) => setRole(e.target.value)}
                className="w-5 h-5 text-amber-700 focus:ring-amber-700"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900 dark:text-white">Order Coffee</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Browse and order from local shops</div>
              </div>
            </label>
            <label className="flex items-center p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:border-amber-700 transition">
              <input
                type="radio"
                name="role"
                value="shop_owner"
                checked={role === "shop_owner"}
                onChange={(e) => setRole(e.target.value)}
                className="w-5 h-5 text-amber-700 focus:ring-amber-700"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900 dark:text-white">Own a Coffee Shop</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Apply to list your shop on the platform</div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-amber-700 text-white py-3 rounded-lg hover:bg-amber-800 transition font-medium"
        >
          Create Account
        </button>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-700 hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}