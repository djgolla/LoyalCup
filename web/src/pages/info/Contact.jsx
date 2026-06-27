import { Mail, Phone, Send, Store } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { API_ORIGIN } from '../../api/client';

const API_URL = API_ORIGIN || 'https://api.loyalcupapp.com';

export default function Contact() {
  const { user, getRole } = useAuth();
  const role = user ? getRole() : null;
  const isShopOwner = role === 'shop_owner';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status} - ${responseBody}`);
      }

      toast.success("Message sent. We'll get back to you within 1 business day.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('[Contact] submit error:', err);
      toast.error("Couldn't send. Email us directly at support@loyalcupapp.com");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100';

  return (
    <div className="bg-[#f6f4f0] text-slate-950">
      <section className="bg-[#080d19] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold">
              <Mail className="h-4 w-4 text-orange-400" />
              Contact LoyalCup
            </div>
            <h1 className="text-5xl font-black leading-[1.04] sm:text-6xl">Questions, launch help, or shop onboarding.</h1>
            <p className="mt-6 text-xl leading-8 text-slate-300">
              Send a note and we will help you get pointed in the right direction.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">Send us a message</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Subject</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows="6" className={`${inputClass} resize-none`} required />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f4762c] px-6 py-4 font-black text-white shadow-lg transition hover:bg-[#ff8642] disabled:opacity-50"
            >
              <Send size={20} />
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-[#101827] p-8 text-white shadow-xl">
            <h2 className="text-2xl font-black">Get in touch</h2>
            <div className="mt-7 space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 text-orange-400">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-black">Email</h3>
                  <a href="mailto:support@loyalcupapp.com" className="text-slate-300 transition hover:text-orange-300">
                    support@loyalcupapp.com
                  </a>
                  <p className="mt-1 text-sm text-slate-400">We respond within 1 business day.</p>
                </div>
              </div>

              {isShopOwner && (
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/10 p-3 text-orange-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-black">Phone for shop owners</h3>
                    <a href="tel:+13098246920" className="text-slate-300 transition hover:text-orange-300">
                      (309) 824-6920
                    </a>
                    <p className="mt-1 text-sm text-slate-400">Mon-Fri, 9am-6pm CST.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Store className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-black">Own a coffee shop?</h3>
            <p className="mt-3 leading-7 text-slate-600">
              Apply to join LoyalCup and launch with ordering, loyalty, Square connection, and location-based billing.
            </p>
            <Link
              to="/shop-application"
              className="mt-6 inline-flex rounded-full bg-[#101827] px-6 py-3 font-black text-white transition hover:bg-[#182238]"
            >
              Start application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
