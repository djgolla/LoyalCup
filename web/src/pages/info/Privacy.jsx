import { Shield, Lock, Eye, FileText, Trash2 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
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
            Last updated: June 15, 2026
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              LoyalCup LLC ("LoyalCup," "we," "our," or "us") provides a mobile app for customers to discover participating coffee shops, place mobile orders, earn and redeem loyalty points, and receive order updates. We also provide a web dashboard for participating shop owners to manage their shop profile, menu, ordering settings, loyalty settings, and orders. This Privacy Policy explains how we collect, use, share, and protect information when you use the LoyalCup mobile application, website, and shop owner dashboard.
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
                  Account Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, and account profile details</li>
                  <li>Authentication information managed through Supabase</li>
                  <li>Shop owner business profile information, if you apply for or operate a shop account</li>
                  <li>Support messages or account deletion requests you send us</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Customer Order and Loyalty Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Participating shops you view, favorite, or order from</li>
                  <li>Menu items, customizations, order totals, order status, and order history</li>
                  <li>Loyalty points earned, pending, redeemed, and adjusted</li>
                  <li>Order notes you choose to provide</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Shop Owner Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Shop name, address, logo, banner, menu, hours, and mobile ordering settings</li>
                  <li>Square connection status and identifiers needed to support POS/mobile ordering</li>
                  <li>Subscription and billing status for the shop owner dashboard</li>
                  <li>Reviews, analytics, and order management information related to your shop</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Customer card payments are processed by Square. LoyalCup LLC does not store full card numbers or card security codes.</li>
                  <li>Shop owner subscriptions are processed by Stripe. LoyalCup LLC does not store full card numbers for subscriptions.</li>
                  <li>We may store transaction identifiers, order totals, refund-related information, and payment status details needed for support, reconciliation, fraud prevention, and records.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Device, Usage, and Location Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device type, operating system, app version, logs, crash/error information, and general usage data</li>
                  <li>Approximate or precise location only if you grant permission, used to show nearby shops</li>
                  <li>Push notification tokens if you enable notifications for order updates</li>
                  <li>IP address and browser/device information when using the website or dashboard</li>
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
              <p>We use information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create, authenticate, and manage LoyalCup accounts</li>
                <li>Show customers nearby and participating coffee shops</li>
                <li>Process orders, payments, refunds, loyalty points, and order updates</li>
                <li>Send push notifications or emails related to account activity, orders, support, or service updates</li>
                <li>Allow shop owners to manage shop profiles, menus, customizations, orders, loyalty settings, and mobile ordering availability</li>
                <li>Provide customer support and respond to contact or deletion requests</li>
                <li>Detect, prevent, and investigate fraud, abuse, security incidents, or violations of our Terms</li>
                <li>Maintain, improve, debug, and secure the LoyalCup platform</li>
                <li>Comply with legal, tax, accounting, payment, and regulatory obligations</li>
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
              We use reasonable technical and organizational safeguards designed to protect your information, including encrypted connections, authentication controls, secure third-party infrastructure, and limited access to service-role systems. No online service can guarantee absolute security, but we work to protect LoyalCup accounts and data from unauthorized access, misuse, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Information Sharing
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>We may share information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Participating Coffee Shops:</strong> Order details, customer name, and information needed to prepare and fulfill orders.</li>
                <li><strong>Square:</strong> Customer order payment processing, POS order creation, and related payment services.</li>
                <li><strong>Stripe:</strong> Shop owner subscription billing and related payment services.</li>
                <li><strong>Supabase:</strong> Authentication, database, storage, and backend infrastructure.</li>
                <li><strong>Service Providers:</strong> Hosting, email, logging, analytics, error monitoring, security, and support tools that help operate LoyalCup.</li>
                <li><strong>Legal or Safety Reasons:</strong> When required by law, to protect rights and safety, enforce our Terms, prevent fraud, or respond to lawful requests.</li>
              </ul>

              <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                We do not sell your personal information.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-amber-700" size={24} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Account Deletion and Data Retention
              </h2>
            </div>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                You can request deletion of your LoyalCup account and associated personal data at{' '}
                <a href="/delete-account" className="text-amber-700 hover:underline font-semibold">
                  loyalcupapp.com/delete-account
                </a>{' '}
                or by emailing support@loyalcupapp.com from the email address tied to your account.
              </p>

              <p>
                When we process an eligible deletion request, we will delete or anonymize account data where legally permitted. Some information may be retained when needed for payment records, tax or accounting obligations, fraud prevention, security, dispute resolution, legal compliance, or legitimate business records.
              </p>

              <p>
                If you are a shop owner, deleting your account may affect access to your shop dashboard and may require separate handling of business, subscription, order, and legal records.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Choices
            </h2>

            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You can access or update some account information in the LoyalCup app or shop owner dashboard.</li>
                <li>You can disable location permissions through your device settings.</li>
                <li>You can disable push notifications through your device settings.</li>
                <li>You can request account deletion through our public deletion page or by contacting support.</li>
                <li>You can contact us about privacy questions at support@loyalcupapp.com.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cookies and Local Storage
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our website and dashboard may use cookies, local storage, or similar technologies to maintain sessions, remember preferences, and support security. The mobile app may use device storage for authentication tokens and app settings. We do not use advertising trackers to sell personal data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              LoyalCup is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, contact us at support@loyalcupapp.com so we can review and take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the "Last updated" date. Your continued use of LoyalCup after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Questions about this Privacy Policy or your data? Contact us at:<br />
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