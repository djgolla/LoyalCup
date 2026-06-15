import { FileCheck, AlertCircle, Scale, XCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
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
            Last updated: June 15, 2026
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Agreement to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              These Terms of Service ("Terms") govern your use of LoyalCup, a service operated by LoyalCup LLC, including the LoyalCup mobile application, website, and shop owner dashboard (collectively, the "Platform"). By accessing or using the Platform, you agree to these Terms. If you do not agree, do not use LoyalCup.
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
                <p>
                  You must be at least 13 years old to use LoyalCup. By using the Platform, you represent that you meet this requirement and that the information you provide is accurate.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Registration</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You are responsible for providing accurate and complete account information.</li>
                  <li>You are responsible for maintaining the security of your account credentials.</li>
                  <li>You must not share your account credentials or allow unauthorized access.</li>
                  <li>You must notify us at support@loyalcupapp.com if you believe your account has been compromised.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prohibited Activities</h3>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Use LoyalCup for unlawful, abusive, fraudulent, or harmful purposes</li>
                  <li>Impersonate another person, shop, or organization</li>
                  <li>Attempt to access accounts, systems, APIs, or data without authorization</li>
                  <li>Interfere with platform security, operations, payments, loyalty systems, or POS integrations</li>
                  <li>Upload malicious code or attempt to reverse engineer or exploit the Platform</li>
                  <li>Manipulate orders, pricing, rewards, loyalty points, referrals, or promotions</li>
                  <li>Harass, threaten, abuse, or harm other users, shops, or LoyalCup LLC staff</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Orders and Payments
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>When placing an order through LoyalCup:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Customer orders are processed through Square and participating coffee shops.</li>
                <li>Payment is charged at the time you place an order, unless a loyalty redemption fully covers the charge.</li>
                <li>Prices, menu availability, item descriptions, taxes, preparation times, and fulfillment are controlled by participating shops and/or their connected POS systems.</li>
                <li>Orders may be unavailable if a shop is closed, has paused mobile ordering, has disconnected payments, or cannot fulfill the order.</li>
                <li>Participating shops are responsible for preparing and fulfilling orders.</li>
                <li>Refund requests should be directed to the shop first. Unresolved issues can be escalated to support@loyalcupapp.com.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Loyalty Program
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                LoyalCup may allow customers to earn, hold, and redeem loyalty points at participating shops. Loyalty settings may vary by shop.
              </p>

              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Points have no cash value and cannot be sold, transferred, or exchanged for cash.</li>
                <li>Points may be pending before becoming redeemable.</li>
                <li>Redemption rules, minimums, values, and availability may vary by shop.</li>
                <li>We may adjust, remove, or reverse points related to refunds, fraud, mistakes, abuse, or system errors.</li>
                <li>We may modify or discontinue loyalty features with notice where appropriate.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Shop Owner Terms
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>If you use LoyalCup as a shop owner:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate shop, menu, pricing, hours, and business information.</li>
                <li>You are responsible for your products, food safety, menu accuracy, order fulfillment, refunds, customer service, and compliance with applicable laws.</li>
                <li>You grant LoyalCup LLC permission to display your shop name, logo, images, menu, hours, offers, and related shop content on the Platform.</li>
                <li>You are responsible for managing whether mobile ordering is enabled or paused for your shop.</li>
                <li>You are responsible for keeping your Square POS connection and payment setup accurate and active if you use mobile ordering.</li>
                <li>Shop owner subscription billing is processed through Stripe. Subscription pricing, billing periods, cancellation, and access may be described during signup or in the shop owner dashboard.</li>
                <li>LoyalCup LLC may suspend shop access or ordering features for security, payment, compliance, fraud, abuse, or platform integrity reasons.</li>
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
                <strong>AS-IS BASIS:</strong> The Platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee uninterrupted, error-free, or fully secure operation.
              </p>
              <p>
                <strong>THIRD-PARTY SERVICES:</strong> LoyalCup integrates with services such as Square, Stripe, Supabase, hosting providers, email providers, and app store platforms. We are not responsible for outages, delays, or errors caused by third-party services.
              </p>
              <p>
                <strong>SHOP RESPONSIBILITY:</strong> LoyalCup is a technology platform connecting customers with independent participating coffee shops. We do not prepare food or drinks and are not responsible for shop products, product quality, allergens, substitutions, delays, or fulfillment.
              </p>
              <p>
                <strong>LIMITATION OF LIABILITY:</strong> To the fullest extent permitted by law, LoyalCup LLC will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, lost rewards, missed orders, or payment processing issues outside our reasonable control.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              The LoyalCup name, logo, software, design, user interface, branding, and platform content are owned by LoyalCup LLC or its licensors and are protected by intellectual property laws. Shop owners retain ownership of their own shop content and grant LoyalCup LLC a license to host, display, reproduce, resize, and distribute that content as needed to operate and promote the Platform.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Suspension, Termination, and Account Deletion
              </h2>
            </div>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                We may suspend or terminate access to the Platform for violations of these Terms, suspected fraud, abuse, nonpayment, security concerns, legal compliance, or platform integrity reasons.
              </p>

              <p>
                You may request deletion of your LoyalCup account and associated personal data at{' '}
                <a href="/delete-account" className="text-amber-700 hover:underline font-semibold">
                  loyalcupapp.com/delete-account
                </a>{' '}
                or by emailing support@loyalcupapp.com. Some information may be retained where legally required or necessary for fraud prevention, security, disputes, payment records, tax/accounting, or compliance.
              </p>

              <p>
                Shop owners may cancel subscription access according to the terms shown during signup, in the dashboard, or through support. Cancellation may not immediately delete legally required business, billing, order, or payment records.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Dispute Resolution
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                If you have an issue, contact support@loyalcupapp.com first so we can try to resolve it informally. Some disputes involving orders, refunds, or product fulfillment may need to be handled by the participating shop or payment processor.
              </p>
              <p>
                To the extent permitted by law, unresolved disputes may be handled through informal negotiation or other dispute resolution procedures available under applicable law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update these Terms from time to time. We will post the updated Terms on this page and update the "Last updated" date. Continued use of the Platform after updates means you accept the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Questions about these Terms? Contact us at:<br />
              <strong>Email:</strong> support@loyalcupapp.com<br />
              <strong>Account deletion:</strong>{' '}
              <a href="/delete-account" className="text-amber-700 hover:underline font-semibold">
                loyalcupapp.com/delete-account
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}