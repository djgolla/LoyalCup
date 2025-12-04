import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import GoogleButton from '../../components/auth/GoogleButton';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-[#121212] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-soft w-full max-w-md border border-gray-200 dark:border-neutral-800 animate-slideUp"
      >
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
          Sign In
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 dark:focus:ring-amber-600 transition text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 dark:focus:ring-amber-600 transition text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/forgot-password"
            className="text-sm text-amber-700 dark:text-amber-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-neutral-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-amber-700 dark:text-amber-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
