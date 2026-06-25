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

  const ic = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 transition focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white';

  return (
    <div className="bg-[#f6f4f0] px-4 py-12 dark:bg-neutral-950">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[2rem] bg-[#080d19] p-8 text-white shadow-2xl">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold">
            <Store className="h-4 w-4 text-orange-400" />
            Shop owner onboarding
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">Join LoyalCup</h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Tell us about your shop and locations. After this, you subscribe, connect Square, and go live.
          </p>
          <div className="mt-8 space-y-3">
            {[
              ['1', 'Shop details', 'Business account and location information'],
              ['2', 'Subscribe', `$${BASE_PRICE}/mo base + $${ADDITIONAL_LOCATION_PRICE}/mo per extra location`],
              ['3', 'Connect Square', 'Link each LoyalCup shop to the right Square location'],
            ].map(([step, title, desc], index) => (
              <div key={step} className={`rounded-2xl border p-4 ${index === 0 ? 'border-orange-400 bg-orange-500/15' : 'border-white/10 bg-white/[0.06]'}`}>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">{step}</span>
                  <span>
                    <span className="block font-black">{title}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-300">{desc}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
              <Store className="w-4 h-4" /> Business Name *
            </label>
            <input name="businessName" value={formData.businessName} onChange={handleChange}
              placeholder="Brew &amp; Bean Coffee" required className={ic} />
          </div>

          <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
              <FileText className="w-4 h-4" /> About Your Shop (optional)
            </label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              placeholder="Tell customers what makes your shop special..." rows={3}
              className={ic + ' resize-none'} />
          </div>

          <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
              <Mail className="w-4 h-4" /> Email Address *
            </label>
            <input name="email" type="email" value={formData.email} onChange={handleChange}
              placeholder="you@yourbusiness.com" required className={ic} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">
              Password * <span className="text-gray-400 font-normal">(you'll use this to log in)</span>
            </label>
            <input name="password" type="password" value={formData.password} onChange={handleChange}
              placeholder="Min 8 characters" required minLength={8} className={ic} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
                <MapPin className="w-4 h-4" /> Location{locations.length > 1 ? 's' : ''} *
              </label>
              <button type="button" onClick={addLocation}
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-sm font-black text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                <Plus className="w-4 h-4" /> Add Location
              </button>
            </div>

            {locations.map((location, index) => (
              <div key={index} className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-[#fbfaf7] p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950 dark:text-white">Location {index + 1}</h3>
                  {locations.length > 1 && (
                    <button type="button" onClick={() => removeLocation(index)}
                      className="inline-flex items-center gap-1 text-sm font-black text-red-500">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">Location Name</label>
                  <input value={location.name} onChange={e => handleLocationChange(index, 'name', e.target.value)}
                    placeholder={index === 0 ? formData.businessName || 'Brew & Bean Coffee' : `${formData.businessName || 'Brew & Bean'} - Downtown`}
                    className={ic} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">Street Address *</label>
                  <input value={location.address} onChange={e => handleLocationChange(index, 'address', e.target.value)}
                    placeholder="123 Main St" required className={ic} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">City *</label>
                    <input value={location.city} onChange={e => handleLocationChange(index, 'city', e.target.value)}
                      placeholder="Austin" required className={ic} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">State *</label>
                    <input value={location.state} onChange={e => handleLocationChange(index, 'state', e.target.value)}
                      placeholder="TX" required maxLength={2} className={ic} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700 dark:text-gray-300">ZIP *</label>
                    <input value={location.zip} onChange={e => handleLocationChange(index, 'zip', e.target.value)}
                      placeholder="78701" required className={ic} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
                    <Phone className="w-4 h-4" /> Phone *
                  </label>
                  <input type="tel" value={location.phone} onChange={e => handleLocationChange(index, 'phone', e.target.value)}
                    placeholder="(512) 555-0100" required className={ic} />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700 dark:text-gray-300">
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
              onChange={handleChange} className="mt-1 h-4 w-4 accent-orange-500" />
            <span className="text-sm text-slate-600 dark:text-gray-400">
              I agree to the{' '}
              <a href="/terms" className="text-orange-600 hover:underline" target="_blank">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-orange-600 hover:underline" target="_blank">Privacy Policy</a>
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-3 rounded-full bg-[#f4762c] py-4 text-lg font-black text-white shadow-xl disabled:opacity-60"
          >
            {loading ? 'Creating your account...' : (
              <>Continue to Subscribe <ArrowRight className="w-5 h-5" /></>
            )}
          </motion.button>

          <p className="text-center text-xs text-slate-400">
            Next step: ${BASE_PRICE}/mo base subscription · +${ADDITIONAL_LOCATION_PRICE}/mo per additional location · Cancel anytime
          </p>
        </form>
      </motion.div>
      </div>
    </div>
  );
}
