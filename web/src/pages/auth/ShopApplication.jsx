import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Coffee, Store, MapPin, Phone, Globe, FileText, MessageSquare } from 'lucide-react';
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
    email: '',         // applicant contact email
    businessLicense: '',
    website: '',
    whyJoin: '',
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

    setLoading(true);

    try {
      // Check if user is logged in — if not, create an account for them first
      const { data: { session } } = await supabase.auth.getSession();

      let userId;

      if (session) {
        userId = session.user.id;
      } else {
        // Anonymous apply: sign them up so we have a user record to attach the shop to.
        // They'll get a confirmation email from Supabase automatically.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
          options: {
            data: { role: 'applicant', full_name: formData.businessName },
          },
        });

        if (signUpError) throw signUpError;
        userId = signUpData.user?.id;
        if (!userId) throw new Error('Failed to create account');
      }

      // Insert shop with status = pending (NOT active)
      const { error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id:         userId,
          name:             formData.businessName,
          description:      formData.description || null,
          address:          formData.address,
          city:             formData.city,
          state:            formData.state,
          zip:              formData.zip,
          phone:            formData.phone,
          website:          formData.website || null,
          business_license: formData.businessLicense || null,
          status:           'pending',   // ← stays pending until admin approves
        });

      if (shopError) throw shopError;

      toast.success('Application submitted! We\'ll be in touch within 24–48 hours.');
      navigate('/application-pending');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-neutral-900 dark:to-neutral-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Join LoyalCup
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Fill out the form below and we'll review your application within 24–48 hours.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-200 dark:border-neutral-800 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Business Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Store className="inline w-4 h-4 mr-1" />
                Business Name <span className="text-red-500">*</span>
              </label>
              <input type="text" name="businessName" value={formData.businessName}
                onChange={handleChange} className={inputClass}
                placeholder="The Coffee Corner" required />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea name="description" value={formData.description}
                onChange={handleChange} rows={3} className={`${inputClass} resize-none`}
                placeholder="Tell us about your coffee shop..." />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Business Address <span className="text-red-500">*</span>
              </label>
              <input type="text" name="address" value={formData.address}
                onChange={handleChange} className={inputClass}
                placeholder="123 Main Street" required />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input type="text" name="city" value={formData.city}
                  onChange={handleChange} className={inputClass}
                  placeholder="Chicago" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input type="text" name="state" value={formData.state}
                  onChange={handleChange} className={inputClass}
                  placeholder="IL" maxLength={2} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ZIP <span className="text-red-500">*</span>
                </label>
                <input type="text" name="zip" value={formData.zip}
                  onChange={handleChange} className={inputClass}
                  placeholder="60601" required />
              </div>
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} className={inputClass}
                  placeholder="(555) 123-4567" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} className={inputClass}
                  placeholder="you@yourcoffeeshop.com" required />
              </div>
            </div>

            {/* License + Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Business License #
                </label>
                <input type="text" name="businessLicense" value={formData.businessLicense}
                  onChange={handleChange} className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Website
                </label>
                <input type="url" name="website" value={formData.website}
                  onChange={handleChange} className={inputClass} placeholder="https://..." />
              </div>
            </div>

            {/* Why Join */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="inline w-4 h-4 mr-1" />
                Why do you want to join LoyalCup?
              </label>
              <textarea name="whyJoin" value={formData.whyJoin}
                onChange={handleChange} rows={3} className={`${inputClass} resize-none`}
                placeholder="Tell us why you'd be a great fit..." />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-amber-600 focus:ring-amber-500 rounded" />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-amber-600 hover:underline font-medium">
                  terms and conditions
                </Link>{' '}
                and understand that my application will be reviewed by the LoyalCup team before I
                get access to the dashboard.
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit Application'}
            </motion.button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:underline">Sign in</Link>
            </p>
                        {/* Pricing reminder */}
            <div className="mt-2 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                LoyalCup costs{' '}
                <span className="font-bold text-gray-900 dark:text-white">$150/month</span>
                {' '}after approval. Your rate is locked in forever — no price increases.{' '}
                <Link to="/pricing" className="text-amber-600 hover:underline font-medium">
                  See what's included →
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}