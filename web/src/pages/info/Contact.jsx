import { Mail, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabase';

export default function Contact() {
  const { user } = useAuth();
  const role = user?.user_metadata?.role;
  const isShopOwner = role === 'shop_owner';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_messages').insert({
        name:    formData.name,
        email:   formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you within 1 business day.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('[Contact] submit error:', err);
      toast.error("Couldn't send — email us directly at support@loyalcupapp.com");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Send us a message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-amber-700 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-700 text-white py-3 rounded-lg hover:bg-amber-800 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={20} />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Get in touch
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                    <Mail className="text-amber-700" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h3>
                    <a
                      href="mailto:support@loyalcupapp.com"
                      className="text-gray-600 dark:text-gray-400 hover:text-amber-700 transition"
                    >
                      support@loyalcupapp.com
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                      We respond within 1 business day
                    </p>
                  </div>
                </div>

                {/* Phone — shop owners only */}
                {isShopOwner && (
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                      <Phone className="text-amber-700" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Phone <span className="text-xs text-amber-600 font-normal">(shop owners)</span>
                      </h3>
                      <a
                        href="tel:+13098246920"
                        className="text-gray-600 dark:text-gray-400 hover:text-amber-700 transition"
                      >
                        (309) 824-6920
                      </a>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                        Mon–Fri, 9am–6pm CST
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Own a coffee shop?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Interested in joining LoyalCup? We'd love to have your shop on the platform.
              </p>
              <a
                href="/shop-application"
                className="inline-block bg-amber-700 text-white px-6 py-2 rounded-lg hover:bg-amber-800 transition font-medium"
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}