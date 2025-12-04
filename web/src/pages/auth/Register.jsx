import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(email, password, "customer");
      toast.success("Account created successfully!");
      navigate("/");
    } catch {
      toast.error("Registration failed. Please try again.");
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
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
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
            className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-700"
            placeholder="••••••••"
            required
          />
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
