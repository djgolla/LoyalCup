import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Mail, ShieldCheck, AlertTriangle, Send } from 'lucide-react';
import { API_ORIGIN } from '../../api/client';

const API_URL = API_ORIGIN || 'https://api.loyalcupapp.com';

export default function DeleteAccount() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    accountType: 'customer',
    message: '',
    confirmDeletion: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.confirmDeletion) {
      toast.error('Please confirm that you want to request account deletion.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/contact/account-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          account_type: formData.accountType,
          message: formData.message,
        }),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to submit request: ${response.status} - ${responseBody}`);
      }

      setSubmitted(true);
      toast.success('Account deletion request received.');
      setFormData({
        name: '',
        email: '',
        accountType: 'customer',
        message: '',
        confirmDeletion: false,
      });
    } catch (err) {
      console.error('[DeleteAccount] submit error:', err);
      toast.error("Couldn't submit the request. Email support@loyalcupapp.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 text-center">
            <div className="flex justify-center mb-5">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                <ShieldCheck className="text-green-700" size={48} />
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Request received
            </h1>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              We received your account deletion request. We will review and process eligible deletion requests within 30 days. If we need to verify ownership of the account, we may contact you at the email address you provided.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
              Some records may be retained when legally required or needed for fraud prevention, payment records, dispute handling, tax/accounting, or security.
            </p>

            <a
              href="/"
              className="inline-block bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition font-medium"
            >
              Back to LoyalCup
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
              <Trash2 className="text-red-700" size={48} />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Delete Your LoyalCup Account
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Use this page to request deletion of your LoyalCup customer or shop owner account and associated personal data.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Account deletion request
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email tied to your LoyalCup account
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account type
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                >
                  <option value="customer">Customer mobile app account</option>
                  <option value="shop_owner">Shop owner web dashboard account</option>
                  <option value="both">Both customer and shop owner</option>
                  <option value="not_sure">Not sure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optional note
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Anything we should know while processing your request?"
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <label className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-4 cursor-pointer">
                <input
                  type="checkbox"
                  name="confirmDeletion"
                  checked={formData.confirmDeletion}
                  onChange={handleChange}
                  className="mt-1"
                />
                <span className="text-sm text-red-900 dark:text-red-200 leading-relaxed">
                  I understand that I am requesting deletion of my LoyalCup account and associated personal data, subject to records LoyalCup may need to retain for legal, security, fraud prevention, payment, tax, accounting, dispute, or compliance reasons.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={20} />
                {submitting ? 'Submitting...' : 'Request Account Deletion'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-amber-700" size={24} />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  What happens next?
                </h2>
              </div>

              <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  After you submit this form, LoyalCup will review the request and verify that the email address belongs to the account.
                </p>

                <p>
                  Eligible account deletion requests are processed within 30 days.
                </p>

                <p>
                  Deletion may remove or anonymize account profile data, favorites, loyalty account records, and app account access where legally permitted.
                </p>

                <p>
                  Some information may be retained when required for payment records, tax/accounting, fraud prevention, security, disputes, legal obligations, or legitimate business records.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="text-amber-700" size={24} />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Need help?
                </h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You can also email us directly from the address tied to your LoyalCup account.
              </p>

              <a
                href="mailto:support@loyalcupapp.com?subject=Delete My LoyalCup Account"
                className="inline-block bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition font-medium"
              >
                support@loyalcupapp.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}