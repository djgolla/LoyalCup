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
            Last updated: June 1, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Agreement to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By accessing or using LoyalCup ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform. These Terms apply to all users — customers using the mobile app and shop owners using the web dashboard.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Use of the Platform
              </h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Eligibility</h3>
                <p>You must be at least 13 years old to use LoyalCup. By using the Platform, you represent that you meet this age requirement.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Registration</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must not share your account credentials with others</li>
                  <li>You must notify us immediately of any unauthorized access at support@loyalcupapp.com</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prohibited Activities</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Use the Platform for any illegal purpose</li>
                  <li>Impersonate another person or entity</li>
                  <li>Interfere with Platform operations or security</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Upload malicious code or harmful content</li>
                  <li>Abuse, manipulate, or fraudulently obtain loyalty points</li>
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
              <p>When placing an order through LoyalCup:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All customer orders are processed through <strong>Square</strong> POS. Your payment is charged by Square at the time of order.</li>
                <li>Orders are subject to acceptance by the participating coffee shop. If a shop is unable to fulfill your order, you will be refunded.</li>
                <li>Prices are set by individual shops and may change without notice.</li>
                <li>LoyalCup is not responsible for order quality or fulfillment — that is the responsibility of the individual shop.</li>
                <li>Refund requests should be directed to the shop first; unresolved issues can be escalated to support@loyalcupapp.com.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loyalty Program
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                LoyalCup's loyalty program lets you earn and redeem points at participating coffee shops. Points have no cash value and cannot be transferred, sold, or exchanged for cash. We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify loyalty program terms at any time with notice</li>
                <li>Expire unused points after a period of inactivity</li>
                <li>Revoke points obtained through fraud, abuse, or system manipulation</li>
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
                <li>You must have an active Square POS account — it is required for order processing</li>
                <li>Your monthly subscription fee is $200/month, billed through Stripe, and activates immediately upon signup</li>
                <li>Your subscription rate is locked in at the price you signed up at, regardless of future price changes</li>
                <li>You must provide accurate business information, menu items, and pricing</li>
                <li>You are responsible for fulfilling orders placed through the Platform in a timely manner</li>
                <li>You grant LoyalCup a license to display your shop name, logo, menu, and images on the Platform</li>
                <li>You are responsible for food safety, quality, and compliance with local regulations</li>
                <li>LoyalCup does not take a commission on customer orders — Square's standard processing fees apply to each transaction</li>
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
                <strong>AS-IS BASIS:</strong> The Platform is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free operation.
              </p>
              <p>
                <strong>LIMITATION OF LIABILITY:</strong> LoyalCup shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Platform, including but not limited to lost orders, missed rewards, or payment processing issues handled by Square or Stripe.
              </p>
              <p>
                <strong>THIRD-PARTY SERVICES:</strong> LoyalCup integrates with Square and Stripe. We are not responsible for outages or errors originating from those services.
              </p>
              <p>
                <strong>SHOP RESPONSIBILITY:</strong> LoyalCup is a platform connecting customers with independent coffee shops. We are not responsible for the actions, products, or services of individual shops.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              All content on the Platform — including the LoyalCup name, logo, UI design, and software — is the property of LoyalCup and is protected by copyright and intellectual property laws. Shop owners retain ownership of their own content (logos, menu items, images) and grant LoyalCup a license to display it.
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
              We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any other reason at our sole discretion. Shop owners may cancel their subscription at any time from the dashboard — cancellation takes effect at the end of the current billing period. You may also request account deletion by emailing support@loyalcupapp.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Dispute Resolution
            </h2>
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>Any disputes arising from these Terms or your use of the Platform shall be resolved through:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Direct contact with our support team at support@loyalcupapp.com</li>
                <li>Informal negotiation</li>
                <li>Binding arbitration if negotiation fails</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Questions about these Terms? Contact us at:<br />
              <strong>Email:</strong> support@loyalcupapp.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}