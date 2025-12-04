import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from '../../lib/auth';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email);
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-[#121212] p-4">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-soft w-full max-w-md border border-gray-200 dark:border-neutral-800 text-center animate-slideUp">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Check Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. Please check
            your inbox and follow the instructions.
          </p>
          <Link
            to="/login"
            className="text-amber-700 dark:text-amber-600 hover:underline font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-[#121212] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-soft w-full max-w-md border border-gray-200 dark:border-neutral-800 animate-slideUp"
      >
        <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
          Forgot Password?
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <div className="mb-6">
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <Link
          to="/login"
          className="block text-center text-sm text-amber-700 dark:text-amber-600 hover:underline"
        >
          Back to Sign In
        </Link>
      </form>
    </div>
  );
}
