import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
              <Shield className="text-amber-700" size={48} />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: June 1, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              LoyalCup ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the LoyalCup mobile application and website (collectively, the "Platform"). By using LoyalCup you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Password (stored hashed — we never see it in plain text)</li>
                  <li>Profile information you choose to provide</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Order & Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Order history and items ordered</li>
                  <li>Loyalty points earned and redeemed</li>
                  <li>Shops viewed and favorited</li>
                  <li>In-app activity and feature usage</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Customer orders are processed through <strong>Square</strong> — we never store your card number or payment details. Square handles all PCI-compliant payment processing.</li>
                  <li>Shop owner subscriptions are billed through <strong>Stripe</strong> — we do not store card data for subscriptions either.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Device & Location Information</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device type and operating system</li>
                  <li>IP address</li>
                  <li>Location data (only if you grant permission) — used to show nearby shops</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Manage your loyalty points and rewards</li>
                <li>Send order confirmations and status updates</li>
                <li>Show you nearby shops (with your location permission)</li>
                <li>Improve the Platform and fix bugs</li>
                <li>Provide customer support</li>
                <li>Send promotional communications (only with your consent)</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Data Security
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use industry-standard security measures including encrypted connections (HTTPS/TLS), hashed passwords, and secure third-party infrastructure (Supabase, Square, Stripe) to protect your data. No method of transmission over the internet is 100% secure, but we take reasonable steps to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information Sharing
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Coffee Shops:</strong> Your name and order details so they can prepare and fulfill your order</li>
                <li><strong>Square:</strong> Payment processing for customer orders</li>
                <li><strong>Stripe:</strong> Subscription billing for shop owners</li>
                <li><strong>Supabase:</strong> Secure database and authentication infrastructure</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                We do not sell your personal information to third parties. Ever.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Rights
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and update your personal information (via Profile / Settings in the app)</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications at any time</li>
                <li>Revoke location permissions at any time through your device settings</li>
              </ul>
              <p className="mt-3">To request account deletion or a data export, email us at <strong>support@loyalcupapp.com</strong> with the subject "Delete My Account" or "Data Request."</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our website uses cookies to maintain your session and remember your preferences. The mobile app uses device storage for authentication tokens. We do not use advertising trackers or sell tracking data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children's Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              LoyalCup is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at support@loyalcupapp.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy here and updating the "Last updated" date. Continued use of the Platform after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions about this Privacy Policy, contact us at:<br />
              <strong>Email:</strong> support@loyalcupapp.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}