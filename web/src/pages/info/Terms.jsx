import { FileCheck, AlertCircle, Scale, XCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
              <FileCheck className="text-amber-700" size={48} />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: January 28, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Agreement to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By accessing or using LoyalCup ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Use of Platform
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Eligibility
                </h3>
                <p>
                  You must be at least 13 years old to use LoyalCup. By using the Platform, you represent that you meet this age requirement.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Account Registration
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must not share your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Prohibited Activities
                </h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Use the Platform for any illegal purpose</li>
                  <li>Impersonate another person or entity</li>
                  <li>Interfere with Platform operations or security</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Upload malicious code or harmful content</li>
                  <li>Harass, abuse, or harm other users or shop owners</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Orders and Payments
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All orders are subject to acceptance by the participating coffee shop</li>
                <li>Prices are set by individual shops and may change without notice</li>
                <li>You authorize payment processing for your orders</li>
                <li>Refunds are handled according to each shop's refund policy</li>
                <li>LoyalCup is not responsible for order quality or fulfillment</li>
                <li>Delivery times are estimates and not guaranteed</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loyalty Program
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                LoyalCup's loyalty program allows you to earn and redeem points at participating coffee shops. Points have no cash value and cannot be transferred or sold. We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify loyalty program terms at any time</li>
                <li>Expire unused points after a period of inactivity</li>
                <li>Revoke points obtained through fraud or abuse</li>
                <li>Terminate your participation for violations of these Terms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Shop Owner Terms
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>If you are a shop owner using LoyalCup:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate business information</li>
                <li>You are responsible for menu accuracy and pricing</li>
                <li>You must fulfill orders in a timely manner</li>
                <li>You grant us license to display your shop information and images</li>
                <li>You are responsible for food safety and quality</li>
                <li>Commission fees apply as outlined in your shop agreement</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Disclaimers and Limitations
              </h2>
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                <strong>AS-IS BASIS:</strong> The Platform is provided "as is" without warranties of any kind, either express or implied.
              </p>
              <p>
                <strong>LIMITATION OF LIABILITY:</strong> LoyalCup shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform.
              </p>
              <p>
                <strong>THIRD-PARTY RESPONSIBILITY:</strong> LoyalCup acts as a platform connecting customers with coffee shops. We are not responsible for the actions, products, or services of shop owners.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All content on the Platform, including text, graphics, logos, and software, is the property of LoyalCup or its content suppliers and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Termination
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any other reason at our sole discretion. You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Dispute Resolution
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                Any disputes arising from these Terms or your use of the Platform shall be resolved through:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Informal negotiation</li>
                <li>Binding arbitration if negotiation fails</li>
                <li>Governed by the laws of the State of California</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms. Material changes will be communicated via email or Platform notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Questions about these Terms? Contact us at:
              <br />
              <strong>Email:</strong> legal@loyalcup.com
              <br />
              <strong>Address:</strong> 123 Coffee Street, San Francisco, CA 94102
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
