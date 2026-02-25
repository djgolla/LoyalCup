import { Coffee, Heart, Target, Users, Award, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-amber-700 p-4 rounded-full">
              <Coffee className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            About LoyalCup
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Empowering local coffee shops with enterprise-level loyalty technology, 
            one cup at a time.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        
        {/* Mission Section */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-amber-700" size={32} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Our Mission
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            LoyalCup was born from a simple observation: while big chains like Starbucks have 
            sophisticated mobile apps and loyalty programs, local coffee shops struggle to compete 
            with outdated technology or expensive, complex systems.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            We believe every coffee shop deserves the same powerful tools as the big brands. 
            Our mission is to level the playing field by providing an affordable, easy-to-use 
            platform that helps local shops build customer loyalty, streamline operations, and grow their business.
          </p>
        </section>

        {/* Values Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
                  <Heart className="text-amber-700" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Local First
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're passionate about supporting local businesses and helping communities 
                thrive by keeping coffee dollars local.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
                  <Sparkles className="text-amber-700" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Simple & Powerful
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Technology should work for you, not against you. We build tools that are 
                intuitive yet powerful enough to scale.
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
                  <Award className="text-amber-700" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Customer Loyalty
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Building lasting relationships between shops and customers through 
                rewards, convenience, and delightful experiences.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            How LoyalCup Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-700 mb-3">
                For Customers
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Discover amazing local coffee shops in your area</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Browse menus and place orders ahead</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Earn loyalty points with every purchase</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Redeem rewards for free drinks and treats</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-amber-700 mb-3">
                For Shop Owners
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Set up your shop in minutes with our simple dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Manage your menu, pricing, and customizations</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Create custom loyalty programs and rewards</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mt-1">
                    <Coffee size={16} className="text-amber-700" />
                  </div>
                  <span>Track orders, analytics, and customer insights</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <div className="flex items-center justify-center gap-3 mb-8">
            <Users className="text-amber-700" size={32} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Our Team
            </h2>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 lg:p-12 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              LoyalCup is built by a small but passionate team of coffee lovers, 
              developers, and entrepreneurs who believe in the power of local businesses. 
              We've worked with dozens of coffee shop owners to understand their challenges 
              and build a platform that truly meets their needs.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Based in San Francisco but supporting coffee shops nationwide, we're committed 
              to continuous improvement based on feedback from our community of shop owners and customers.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-amber-700 to-orange-600 rounded-xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Join LoyalCup?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you're a coffee lover or a shop owner, we'd love to have you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-white text-amber-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-bold"
            >
              Sign Up as Customer
            </a>
            <a
              href="/shop-application"
              className="bg-neutral-900 text-white px-8 py-3 rounded-lg hover:bg-neutral-800 transition font-bold"
            >
              List Your Shop
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
