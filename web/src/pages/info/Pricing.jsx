import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BarChart3,
  Check,
  Headphones,
  MapPin,
  Menu,
  RefreshCw,
  Shield,
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  Users,
} from 'lucide-react';

const BASE_PRICE = 150;
const ADDITIONAL_LOCATION_PRICE = 50;

const features = [
  { icon: Smartphone, title: 'Customer app listing', desc: 'Your shop appears in LoyalCup for nearby customers to discover, browse, order, and earn rewards.' },
  { icon: Menu, title: 'Square menu import', desc: 'Items, categories, modifier groups, and prices sync from the Square menu you already maintain.' },
  { icon: ShoppingBag, title: 'Mobile ordering', desc: 'Customer orders are paid through Square and sent into your existing Square workflow.' },
  { icon: Award, title: 'Built-in loyalty', desc: 'Points and rewards are managed for you, so customers get a reason to come back.' },
  { icon: RefreshCw, title: 'POS sync', desc: 'Keep Square as the source of truth while LoyalCup powers the customer-facing app experience.' },
  { icon: BarChart3, title: 'Analytics dashboard', desc: 'Track orders, revenue, popular items, customers, and location performance.' },
  { icon: Users, title: 'Customer insights', desc: 'Understand regulars, order history, and activity across the shops you operate.' },
  { icon: Headphones, title: 'Priority support', desc: 'Direct help getting connected, launched, and cleaned up when something needs attention.' },
];

const faqs = [
  ['Is there a contract or commitment?', 'No. LoyalCup is month-to-month with no setup fee and no long-term contract.'],
  ['Do I need Square to use LoyalCup?', 'Yes. Square POS is required because customer orders are created and paid through Square. LoyalCup subscription billing is handled separately through Stripe.'],
  ['How does customer payment processing work?', `Customer orders are processed by Square using your Square account. LoyalCup's $${BASE_PRICE}/mo platform fee is separate and includes your first location.`],
  ['What if I have more than one location?', `Your first location is included. Additional locations are $${ADDITIONAL_LOCATION_PRICE}/mo each, and each location can keep its own menu, Square location, orders, and dashboard data.`],
  ['Can I use a promo code?', 'Yes. If you have a promo code, enter it during Stripe checkout and the discount will apply there.'],
  ['What happens if prices change later?', 'Your rate is locked in from the day you subscribe. If public pricing changes later, your existing account keeps its current rate.'],
];

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f6f4f0] text-slate-950">
      <section className="relative overflow-hidden bg-[#080d19]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(244,118,44,0.30),transparent_30%),radial-gradient(circle_at_16%_84%,rgba(43,92,184,0.28),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600">
                <Shield className="h-4 w-4" />
              </span>
              Simple pricing for serious shops
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.04] text-white sm:text-6xl">
              $150/month for your first location. $50/month for each additional location.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300">
              One platform plan includes the customer app, owner dashboard, Square ordering flow, loyalty, analytics, and support.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/shop-application')}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 font-black text-white shadow-xl transition hover:bg-[#ff8642]"
              >
                Start application
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-7 py-4 font-black text-slate-950 transition hover:bg-slate-100"
              >
                Talk to us first
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-2xl"
          >
            <div className="rounded-3xl bg-[#f8f6f2] p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-600">Platform plan</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-7xl font-black">${BASE_PRICE}</span>
                <span className="pb-3 text-xl font-bold text-slate-500">/mo</span>
              </div>
              <p className="mt-2 font-semibold text-slate-600">Includes your first active location.</p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="font-bold text-slate-700">First location</span>
                <span className="font-black">${BASE_PRICE}/mo</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="font-bold text-slate-700">Additional locations</span>
                <span className="font-black">${ADDITIONAL_LOCATION_PRICE}/mo each</span>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 h-5 w-5 text-orange-600" />
                  <p className="text-sm font-semibold leading-6 text-orange-900">
                    Have a promo code? Enter it during Stripe checkout and your discount applies there.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/shop-application')}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#101827] px-6 py-4 font-black text-white transition hover:bg-[#182238]"
            >
              Get started
              <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Everything included</p>
          <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            No feature tiers. No “call for pricing” nonsense.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            LoyalCup is built for local coffee shops that need a professional app experience without enterprise software drama.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Feature key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Multi-location ready</p>
            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Add locations when the business already has them.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Multi-location owners can apply with more than one shop, subscribe based on active location count, then connect each shop to the correct Square location.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: Store, title: 'One account, multiple shops', body: 'Owners can manage more than one location without creating separate business accounts.' },
              { icon: MapPin, title: 'Location-level setup', body: 'Each shop can keep distinct address, phone, menu, Square location, and operational settings.' },
              { icon: Shield, title: 'Billing follows active locations', body: `The base subscription covers one location; extra active locations add $${ADDITIONAL_LOCATION_PRICE}/mo each.` },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-[#f8f6f2] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#101827] text-orange-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 leading-6 text-slate-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">FAQ</p>
          <h2 className="mt-4 text-4xl font-black">Questions owners ask first.</h2>
        </div>
        <div className="mt-10 grid gap-4">
          {faqs.map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black">{q}</h3>
              <p className="mt-2 leading-7 text-slate-600">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#101827] py-20 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-400">Launch cleanly</p>
            <h2 className="mt-3 text-4xl font-black">Ready to put your shop in the app?</h2>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300">
              Apply, subscribe, connect Square, and start taking mobile orders with a rate you understand.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop-application')}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 font-black text-white shadow-lg transition hover:bg-[#ff8642]"
          >
            Apply now
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
