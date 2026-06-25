import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Heart, RefreshCw, ShieldCheck, Store, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-[#f6f4f0] text-slate-950">
      <section className="bg-[#080d19] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold">
              <Coffee className="h-4 w-4 text-orange-400" />
              About LoyalCup
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.04] sm:text-6xl">
              Local coffee shops deserve software that feels as good as the big chains.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300">
              LoyalCup gives independent coffee shops a polished customer app, built-in rewards, Square-connected ordering, and multi-location tools without forcing them into a new POS workflow.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl">
            <img
              src="/app-screens/discover.jpg"
              alt="LoyalCup app showing local coffee shop discovery"
              className="h-[560px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              icon: Heart,
              title: 'Local first',
              body: 'We are building for independent shops and the customers who want those shops to win.',
            },
            {
              icon: RefreshCw,
              title: 'Operationally practical',
              body: 'Square stays central, so owners can add mobile ordering without rebuilding their counter workflow.',
            },
            {
              icon: ShieldCheck,
              title: 'Clear and durable',
              body: 'Simple pricing, transparent setup, and tools that can grow from one location to several.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">How it works</p>
            <h2 className="mt-4 text-4xl font-black leading-tight">One product, two sides of the counter.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Customers get an app they understand immediately. Owners get a dashboard that keeps ordering, menus, loyalty, and locations organized.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: Users, title: 'Customers discover and order', body: 'Nearby shops, menus, rewards, item customization, checkout, and pickup status live in the app.' },
              { icon: Store, title: 'Owners manage the business', body: 'Shop owners manage menus, orders, settings, analytics, loyalty, Square connections, and location details.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-[#f8f6f2] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#101827] text-orange-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 leading-7 text-slate-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">Join the platform</p>
          <h2 className="mt-3 text-4xl font-black">Ready to bring your shop onto LoyalCup?</h2>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Start with one location or apply with multiple shops from day one.
          </p>
        </div>
        <Link
          to="/shop-application"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f4762c] px-7 py-4 font-black text-white shadow-lg transition hover:bg-[#ff8642]"
        >
          Apply to join
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}
