import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock } from "lucide-react";

export default function ApplicationPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="w-24 h-24 text-green-500" />
              <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-full p-2">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Application Submitted! ✅
          </h1>

          {/* Message */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Thank you for applying to join LoyalCup! We're reviewing your shop application.
          </p>

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2">
              What happens next?
            </h2>
            <ul className="text-left text-amber-800 dark:text-amber-400 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Our team will review your application within 24-48 hours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll receive an email notification once your shop is approved</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>After approval, you'll gain access to your shop dashboard to set up your menu</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-amber-700 text-white py-3 px-6 rounded-lg hover:bg-amber-800 transition font-medium"
            >
              Return to Home
            </button>
            <button
              onClick={() => window.location.href = "mailto:support@loyalcup.com"}
              className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-700 transition font-medium"
            >
              Contact Support
            </button>
          </div>

          {/* Additional Info */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
            If you have any questions, please don't hesitate to reach out to our support team at{" "}
            <a href="mailto:support@loyalcup.com" className="text-amber-700 hover:underline">
              support@loyalcup.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
