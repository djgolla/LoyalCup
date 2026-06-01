import { useNavigate } from "react-router-dom";
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react";

export default function ApplicationPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Shop details saved! ✅
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            One more step — subscribe to activate your shop and go live instantly.
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-300 mb-3">
              What's next
            </h2>
            <ul className="text-amber-800 dark:text-amber-400 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Shop details submitted</span>
              </li>
              <li className="flex items-center gap-2 opacity-60">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Subscribe to activate ($150/mo · cancel anytime)</span>
              </li>
              <li className="flex items-center gap-2 opacity-40">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Connect Square &amp; go live 🚀</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/shop-owner/subscribe")}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Subscribe &amp; Activate
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-white py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition font-medium"
            >
              Back to Home
            </button>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
            Questions?{" "}
            <a href="mailto:support@loyalcupapp.com" className="text-amber-700 hover:underline">
              support@loyalcupapp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}