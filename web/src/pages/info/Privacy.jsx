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
            Last updated: January 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              LoyalCup ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Platform").
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
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, and phone number</li>
                  <li>Profile picture or avatar</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Delivery addresses</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Usage Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Order history and preferences</li>
                  <li>Loyalty points and rewards activity</li>
                  <li>Interaction with shops and menu items</li>
                  <li>Device information and IP address</li>
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
                <li>Process your orders and payments</li>
                <li>Manage your loyalty rewards and points</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our Platform and services</li>
                <li>Provide customer support</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Detect and prevent fraud</li>
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
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information Sharing
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Coffee Shops:</strong> Order details and delivery information</li>
                <li><strong>Payment Processors:</strong> Secure payment processing</li>
                <li><strong>Service Providers:</strong> Analytics, hosting, and customer support</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information to third parties.
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
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies and Tracking
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookies through your browser settings, but disabling them may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children's Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our Platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
              <br />
              <strong>Email:</strong> privacy@loyalcup.com
              <br />
              <strong>Address:</strong> 123 Coffee Street, San Francisco, CA 94102
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
