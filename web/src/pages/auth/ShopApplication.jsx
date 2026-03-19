import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Globe, FileText, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../../lib/supabase';

export default function ShopApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    password: '',
    website: '',
    agreeToTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      // Check if already logged in
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      let userId;
      let userEmail = formData.email;

      if (existingSession) {
        // Already logged in — use their account
        userId = existingSession.user.id;
        userEmail = existingSession.user.email;
      } else {
        // Create account AND sign them in immediately
        const tempPassword = formData.password;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: { role: 'applicant', full_name: formData.businessName },
          },
        });

        if (signUpError) throw signUpError;

        // signUp in Supabase auto-signs them in if email confirmation is disabled
        // If email confirmation IS enabled, we need to sign in immediately
        if (!signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: tempPassword,
          });
          if (signInError) throw signInError;
          userId = signInData.user?.id;
        } else {
          userId = signUpData.user?.id;
        }

        if (!userId) throw new Error('Failed to create account');
      }

      // Create shop with status = pending_payment
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id:    userId,
          name:        formData.businessName,
          description: formData.description || null,
          address:     formData.address,
          city:        formData.city,
          state:       formData.state,
          zip:         formData.zip,
          phone:       formData.phone,
          website:     formData.website || null,
          status:      'pending_payment',
        })
        .select('id')
        .single();

      if (shopError) throw shopError;

      toast.success('Almost there! Complete your subscription to go live.');
      navigate('/shop-owner/subscribe');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const ic = 'w-full px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition text-sm';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Join LoyalCup</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Tell us about your shop — then subscribe to go live instantly.
        </p>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-bold">
            <span>1</span> <span>Shop Details</span>
          </div>
          <div className="w-6 h-0.5 bg-gray-300 dark:bg-neutral-700" />
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-400 rounded-full text-sm font-bold">
            <span>2</span> <span>Subscribe &amp; Activate</span>
          </div>
          <div className="w-6 h-0.5 bg-gray-300 dark:bg-neutral-700" />
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-400 rounded-full text-sm font-bold">
            <span>3</span> <span>Setup &amp; Go Live</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Store className="w-4 h-4" /> Business Name *
            </label>
            <input name="businessName" value={formData.businessName} onChange={handleChange}
              placeholder="Brew &amp; Bean Coffee" required className={ic} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> About Your Shop (optional)
            </label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              placeholder="Tell customers what makes your shop special..." rows={3}
              className={ic + ' resize-none'} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Email Address *
            </label>
            <input name="email" type="email" value={formData.email} onChange={handleChange}
              placeholder="you@yourbusiness.com" required className={ic} />
          </div>

          {/* Password — needed so they can log back in */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password * <span className="text-gray-400 font-normal">(you'll use this to log in)</span>
            </label>
            <input name="password" type="password" value={formData.password} onChange={handleChange}
              placeholder="Min 8 characters" required minLength={8} className={ic} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Street Address *
            </label>
            <input name="address" value={formData.address} onChange={handleChange}
              placeholder="123 Main St" required className={ic} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
              <input name="city" value={formData.city} onChange={handleChange}
                placeholder="Austin" required className={ic} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State *</label>
              <input name="state" value={formData.state} onChange={handleChange}
                placeholder="TX" required maxLength={2} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ZIP *</label>
              <input name="zip" value={formData.zip} onChange={handleChange}
                placeholder="78701" required className={ic} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Phone *
            </label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
              placeholder="(512) 555-0100" required className={ic} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> Website (optional)
            </label>
            <input name="website" type="url" value={formData.website} onChange={handleChange}
              placeholder="https://yourshop.com" className={ic} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms}
              onChange={handleChange} className="mt-1 w-4 h-4 accent-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <a href="/terms" className="text-amber-600 hover:underline" target="_blank">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-amber-600 hover:underline" target="_blank">Privacy Policy</a>
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 mt-2"
          >
            {loading ? 'Creating your account...' : (
              <>Continue to Subscribe <ArrowRight className="w-5 h-5" /></>
            )}
          </motion.button>

          <p className="text-center text-xs text-gray-400">
            Next step: $150/mo subscription · Activates instantly · Cancel anytime
          </p>
        </form>
      </motion.div>
    </div>
  );
}