import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, Phone, Mail, Globe, FileText, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../../lib/supabase';
import { apiUrl } from '../../api/client';

const BASE_PRICE = 150;
const ADDITIONAL_LOCATION_PRICE = 50;

export default function ShopApplication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    email: '',
    password: '',
    agreeToTerms: false,
  });
  const [locations, setLocations] = useState([
    { name: '', address: '', city: '', state: '', zip: '', phone: '', website: '' },
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLocationChange = (index, field, value) => {
    setLocations(prev => prev.map((location, i) => (
      i === index ? { ...location, [field]: value } : location
    )));
  };

  const addLocation = () => {
    setLocations(prev => [
      ...prev,
      { name: '', address: '', city: '', state: '', zip: '', phone: '', website: '' },
    ]);
  };

  const removeLocation = (index) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
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
    if (locations.length < 1) {
      toast.error('Please add at least one location');
      return;
    }
    const incompleteLocation = locations.some(location => (
      !location.address || !location.city || !location.state || !location.zip || !location.phone
    ));
    if (incompleteLocation) {
      toast.error('Please complete the required fields for each location');
      return;
    }
    setLoading(true);
    try {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      let session = existingSession;

      if (existingSession) {
        session = existingSession;
      } else {
        const tempPassword = formData.password;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: { role: 'applicant', full_name: formData.businessName },
          },
        });

        if (signUpError) throw signUpError;

        if (!signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: tempPassword,
          });
          if (signInError) throw signInError;
          session = signInData.session;
        } else {
          session = signUpData.session;
        }

        if (!session?.access_token) throw new Error('Failed to create account session');
      }

      const firstLocation = locations[0];
      const normalizedLocations = locations.map((location, index) => ({
        name: location.name || (locations.length === 1 ? formData.businessName : `${formData.businessName} - Location ${index + 1}`),
        description: formData.description || null,
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        phone: location.phone,
        website: location.website || null,
      }));

      const response = await fetch(apiUrl('/api/v1/shops/apply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.businessName,
          description: formData.description || null,
          address: firstLocation.address,
          city: firstLocation.city,
          state: firstLocation.state,
          zip: firstLocation.zip,
          phone: firstLocation.phone,
          website: firstLocation.website || null,
          locations: normalizedLocations,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.detail || 'Failed to submit application');

      toast.success('Almost there! Complete your subscription to go live.');
      navigate('/shop-owner/subscribe');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const ic = 'w-full px-4 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 transition';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Join LoyalCup</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Tell us about your shop — then subscribe to go live instantly.
        </p>
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
            <span>3</span> <span>Connect Square &amp; Go Live</span>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password * <span className="text-gray-400 font-normal">(you'll use this to log in)</span>
            </label>
            <input name="password" type="password" value={formData.password} onChange={handleChange}
              placeholder="Min 8 characters" required minLength={8} className={ic} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Location{locations.length > 1 ? 's' : ''} *
              </label>
              <button type="button" onClick={addLocation}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Plus className="w-4 h-4" /> Add Location
              </button>
            </div>

            {locations.map((location, index) => (
              <div key={index} className="rounded-2xl border-2 border-gray-200 dark:border-neutral-800 p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">Location {index + 1}</h3>
                  {locations.length > 1 && (
                    <button type="button" onClick={() => removeLocation(index)}
                      className="inline-flex items-center gap-1 text-sm font-bold text-red-500">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location Name</label>
                  <input value={location.name} onChange={e => handleLocationChange(index, 'name', e.target.value)}
                    placeholder={index === 0 ? formData.businessName || 'Brew & Bean Coffee' : `${formData.businessName || 'Brew & Bean'} - Downtown`}
                    className={ic} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Street Address *</label>
                  <input value={location.address} onChange={e => handleLocationChange(index, 'address', e.target.value)}
                    placeholder="123 Main St" required className={ic} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                    <input value={location.city} onChange={e => handleLocationChange(index, 'city', e.target.value)}
                      placeholder="Austin" required className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State *</label>
                    <input value={location.state} onChange={e => handleLocationChange(index, 'state', e.target.value)}
                      placeholder="TX" required maxLength={2} className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ZIP *</label>
                    <input value={location.zip} onChange={e => handleLocationChange(index, 'zip', e.target.value)}
                      placeholder="78701" required className={ic} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" /> Phone *
                  </label>
                  <input type="tel" value={location.phone} onChange={e => handleLocationChange(index, 'phone', e.target.value)}
                    placeholder="(512) 555-0100" required className={ic} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Website (optional)
                  </label>
                  <input type="url" value={location.website} onChange={e => handleLocationChange(index, 'website', e.target.value)}
                    placeholder="https://yourshop.com" className={ic} />
                </div>
              </div>
            ))}
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
            Next step: ${BASE_PRICE}/mo base subscription · +${ADDITIONAL_LOCATION_PRICE}/mo per additional location · Cancel anytime
          </p>
        </form>
      </motion.div>
    </div>
  );
}
