import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store, MapPin, Clock, Image as ImageIcon,
  Save, Upload, X, Check, Smartphone, Power, Award, Sparkles, Globe,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DEFAULT_HOURS = {
  monday:    { open: '09:00', close: '17:00', closed: false },
  tuesday:   { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday:  { open: '09:00', close: '17:00', closed: false },
  friday:    { open: '09:00', close: '17:00', closed: false },
  saturday:  { open: '10:00', close: '16:00', closed: false },
  sunday:    { open: '10:00', close: '16:00', closed: false },
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const label12 = h === 0 ? `12:${mm} AM` : h < 12 ? `${h}:${mm} AM` : h === 12 ? `12:${mm} PM` : `${h - 12}:${mm} PM`;
    TIME_OPTIONS.push({ value: `${hh}:${mm}`, label: label12 });
  }
}

// ── Authed fetch (uses Supabase JWT for /api/v1/loyalty/*)
async function authedFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || data?.message || `Request failed (${res.status})`);
  return data;
}

export default function ShopSettings() {
  const { shop, shopId, loadShop } = useShop();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [dragActive, setDragActive] = useState(null);

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', city: '', state: '', zip: '',
    phone: '', website: '', logo_url: '', banner_url: '',
    hours: DEFAULT_HOURS, mobile_ordering_enabled: true,
  });

  // ── Loyalty state (separate from shop row — lives in shop_loyalty_settings)
  const [loyalty, setLoyalty] = useState({
    use_global_system:      true,
    points_per_dollar:      10,
    min_redemption_points:  200,
    points_to_dollar_value: 0.005,
    bonus_active:           false,
    bonus_multiplier:       1.0,
    bonus_description:      '',
  });
  const [loyaltyGlobal, setLoyaltyGlobal] = useState(null);
  const [loyaltySaving, setLoyaltySaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setFormData({
        name:                    shop.name                    || '',
        description:             shop.description             || '',
        address:                 shop.address                 || '',
        city:                    shop.city                    || '',
        state:                   shop.state                   || '',
        zip:                     shop.zip                     || '',
        phone:                   shop.phone                   || '',
        website:                 shop.website                 || '',
        logo_url:                shop.logo_url                || '',
        banner_url:              shop.banner_url              || '',
        hours:                   shop.hours                   || DEFAULT_HOURS,
        mobile_ordering_enabled: shop.mobile_ordering_enabled ?? true,
      });
    }
  }, [shop]);

  // Load loyalty config when shopId is ready
  useEffect(() => {
    if (!shopId) return;
    (async () => {
      try {
        const [cfg, glob] = await Promise.all([
          authedFetch(`/api/v1/loyalty/shop-settings/${shopId}`),
          authedFetch(`/api/v1/loyalty/global-config`),
        ]);
        setLoyaltyGlobal(glob);
        setLoyalty({
          use_global_system:      cfg.use_global_system,
          points_per_dollar:      cfg.points_per_dollar,
          min_redemption_points:  cfg.min_redemption_points,
          points_to_dollar_value: cfg.points_to_dollar_value,
          bonus_active:           !!cfg.bonus_active,
          bonus_multiplier:       cfg.bonus_multiplier || 1.0,
          bonus_description:      cfg.bonus_description || '',
        });
      } catch (e) {
        console.warn('[ShopSettings] loyalty load:', e.message);
      }
    })();
  }, [shopId]);

  const handleImageUpload = async (file, type) => {
    if (!file || !shopId) return;
    try {
      setUploading(type);
      const fileExt  = file.name.split('.').pop();
      const fileName = `${shopId}/${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('shop-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('shop-images').getPublicUrl(fileName);
      const field = type === 'logo' ? 'logo_url' : 'banner_url';
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(type);
    else if (e.type === 'dragleave') setDragActive(null);
  };
  const handleDrop = (e, type) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(null);
    if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0], type);
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], [field]: value } },
    }));
  };
  const applyToAll = (sourceDay) => {
    const source = formData.hours[sourceDay];
    const newHours = {};
    DAYS.forEach(d => { newHours[d] = { ...source }; });
    setFormData(prev => ({ ...prev, hours: newHours }));
    toast.success('Hours applied to all days');
  };
  const applyToWeekdays = (sourceDay) => {
    const source = formData.hours[sourceDay];
    const newHours = { ...formData.hours };
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(d => { newHours[d] = { ...source }; });
    setFormData(prev => ({ ...prev, hours: newHours }));
    toast.success('Hours applied to weekdays');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('shops').update({
        name:                    formData.name,
        description:             formData.description             || null,
        address:                 formData.address                 || null,
        city:                    formData.city                    || null,
        state:                   formData.state                   || null,
        zip:                     formData.zip                     || null,
        phone:                   formData.phone                   || null,
        website:                 formData.website                 || null,
        logo_url:                formData.logo_url                || null,
        banner_url:              formData.banner_url              || null,
        hours:                   formData.hours,
        mobile_ordering_enabled: formData.mobile_ordering_enabled,
        updated_at:              new Date().toISOString(),
      }).eq('id', shopId);
      if (error) throw error;
      toast.success('Settings saved!');
      loadShop();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLoyalty = async () => {
    if (!shopId) return;
    try {
      setLoyaltySaving(true);
      const body = {
        use_global_system: loyalty.use_global_system,
        bonus_active:      !!loyalty.bonus_active,
        bonus_multiplier:  Number(loyalty.bonus_multiplier) || 1.0,
        bonus_description: loyalty.bonus_description || null,
      };
      if (!loyalty.use_global_system) {
        body.points_per_dollar      = Number(loyalty.points_per_dollar);
        body.min_redemption_points  = Number(loyalty.min_redemption_points);
        body.points_to_dollar_value = Number(loyalty.points_to_dollar_value);
      }
      const updated = await authedFetch(`/api/v1/loyalty/shop-settings/${shopId}`, {
        method: 'PUT',
        body:   JSON.stringify(body),
      });
      setLoyalty({
        use_global_system:      updated.use_global_system,
        points_per_dollar:      updated.points_per_dollar,
        min_redemption_points:  updated.min_redemption_points,
        points_to_dollar_value: updated.points_to_dollar_value,
        bonus_active:           !!updated.bonus_active,
        bonus_multiplier:       updated.bonus_multiplier || 1.0,
        bonus_description:      updated.bonus_description || '',
      });
      toast.success('Loyalty program saved!');
    } catch (e) {
      toast.error(e.message || 'Failed to save loyalty');
    } finally {
      setLoyaltySaving(false);
    }
  };

  // Helpful previews
  const effectivePpd  = loyalty.use_global_system ? (loyaltyGlobal?.points_per_dollar      || 10)    : loyalty.points_per_dollar;
  const effectiveStep = loyalty.use_global_system ? (loyaltyGlobal?.min_redemption_points  || 200)   : loyalty.min_redemption_points;
  const effectivePV   = loyalty.use_global_system ? (loyaltyGlobal?.points_to_dollar_value || 0.005) : loyalty.points_to_dollar_value;
  const pctBack       = effectiveStep && effectivePpd ? ((effectivePpd * effectivePV * 100)).toFixed(1) : '—';

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Shop Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your shop information and preferences</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Mobile Ordering Toggle ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${formData.mobile_ordering_enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <Smartphone className={`w-5 h-5 ${formData.mobile_ordering_enabled ? 'text-green-600' : 'text-red-500'}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Mobile Ordering
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${formData.mobile_ordering_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {formData.mobile_ordering_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </h2>
                <p className="text-sm text-gray-500">Allow customers to place orders from the app. Turn off to pause ordering temporarily.</p>
              </div>
            </div>
            <button type="button"
              onClick={() => setFormData(prev => ({ ...prev, mobile_ordering_enabled: !prev.mobile_ordering_enabled }))}
              className={`relative w-14 h-7 rounded-full transition-colors shrink-0 focus:outline-none ${formData.mobile_ordering_enabled ? 'bg-green-500' : 'bg-red-400'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${formData.mobile_ordering_enabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
          {!formData.mobile_ordering_enabled && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <Power className="w-4 h-4 shrink-0" /> Customers will see "Ordering unavailable". Save settings to apply.
            </div>
          )}
        </motion.div>

        {/* ── Shop Images ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" /> Shop Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { type: 'logo',   label: 'Logo',   field: 'logo_url',   aspect: 'w-32 h-32 mx-auto object-cover rounded-xl' },
              { type: 'banner', label: 'Banner', field: 'banner_url', aspect: 'w-full h-32 object-cover rounded-xl' },
            ].map(({ type, label, field, aspect }) => (
              <div key={type}>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{label}</label>
                <div
                  onDragEnter={e => handleDrag(e, type)} onDragLeave={e => handleDrag(e, type)}
                  onDragOver={e => handleDrag(e, type)}  onDrop={e => handleDrop(e, type)}
                  className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition ${dragActive === type ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-300 dark:border-neutral-700'}`}
                >
                  {formData[field] ? (
                    <div className="relative">
                      <img src={formData[field]} alt={label} className={aspect} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, [field]: '' }))}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                        {uploading === type ? 'Uploading...' : `Drop ${label.toLowerCase()} here`}
                      </p>
                      <label className="inline-block px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold cursor-pointer hover:bg-amber-600 transition text-sm">
                        Choose File
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], type)} className="hidden" disabled={!!uploading} />
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Basic Information ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" /> Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Shop Name *</label>
              <input type="text" value={formData.name} required
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea value={formData.description} rows="3"
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
              <input type="tel" value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
              <input type="url" value={formData.website} placeholder="https://..."
                onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </motion.div>

        {/* ── Location ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" /> Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Address</label>
              <input type="text" value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">City</label>
              <input type="text" value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">State</label>
              <input type="text" value={formData.state}
                onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">ZIP Code</label>
              <input type="text" value={formData.zip}
                onChange={e => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </motion.div>

        {/* ── Business Hours ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Business Hours
          </h2>
          <div className="space-y-2">
            {DAYS.map(day => {
              const h = formData.hours[day] || { open: '09:00', close: '17:00', closed: false };
              return (
                <div key={day} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${h.closed ? 'bg-gray-50 dark:bg-neutral-800/50 opacity-60' : 'bg-gray-50 dark:bg-neutral-800'}`}>
                  <span className="w-10 text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0">{DAY_ABBR[day]}</span>
                  <button type="button" onClick={() => handleHoursChange(day, 'closed', !h.closed)}
                    className={`rounded-full transition-colors shrink-0 ${h.closed ? 'bg-red-400' : 'bg-green-500'}`}
                    style={{ height: '18px', width: '32px', minWidth: '32px' }}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow mx-0.5 transition-transform ${h.closed ? 'translate-x-0' : 'translate-x-3.5'}`} style={{ marginTop: '1px' }} />
                  </button>
                  {h.closed ? (
                    <span className="text-sm text-red-500 font-semibold flex-1">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <select value={h.open} onChange={e => handleHoursChange(day, 'open', e.target.value)}
                        className="text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 transition">
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <span className="text-gray-400 text-xs">–</span>
                      <select value={h.close} onChange={e => handleHoursChange(day, 'close', e.target.value)}
                        className="text-sm bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 transition">
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  )}
                  {!h.closed && (
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => applyToWeekdays(day)} title="Apply to weekdays"
                        className="text-[10px] px-2 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-500 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition font-semibold">M-F</button>
                      <button type="button" onClick={() => applyToAll(day)} title="Apply to all days"
                        className="text-[10px] px-2 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-500 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition font-semibold">All</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Save shop info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-end">
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50">
            {loading ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Save className="w-5 h-5" /></motion.div>Saving...</> : <><Check className="w-5 h-5" />Save Settings</>}
          </motion.button>
        </motion.div>
      </form>

      {/* ── Loyalty Program (outside the main form — saves independently) ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Loyalty Program</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choose how customers earn and redeem points at your shop.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <button type="button"
            onClick={() => setLoyalty(l => ({ ...l, use_global_system: true }))}
            className={`text-left p-4 rounded-xl border-2 transition ${loyalty.use_global_system ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 hover:border-gray-300'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-gray-900 dark:text-white">Use LoyalCup Global Program</span>
              {loyalty.use_global_system && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
            </div>
            <p className="text-xs text-gray-500">
              {loyaltyGlobal
                ? `${loyaltyGlobal.points_per_dollar} pts per $1 · ${loyaltyGlobal.min_redemption_points} pts = $${(loyaltyGlobal.min_redemption_points * loyaltyGlobal.points_to_dollar_value).toFixed(2)} off · ${(loyaltyGlobal.points_per_dollar * loyaltyGlobal.points_to_dollar_value * 100).toFixed(1)}% effective cashback`
                : 'Customers earn cross-shop points usable at any LoyalCup shop.'}
            </p>
          </button>

          <button type="button"
            onClick={() => setLoyalty(l => ({ ...l, use_global_system: false }))}
            className={`text-left p-4 rounded-xl border-2 transition ${!loyalty.use_global_system ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 hover:border-gray-300'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-gray-900 dark:text-white">Custom Shop Program</span>
              {!loyalty.use_global_system && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
            </div>
            <p className="text-xs text-gray-500">
              Set your own earning rate, redemption step, and point value. Points are scoped to your shop only.
            </p>
          </button>
        </div>

        {/* Custom fields (only shown when custom) */}
        {!loyalty.use_global_system && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Points per $1 spent</label>
              <input type="number" min="0" step="1"
                value={loyalty.points_per_dollar}
                onChange={e => setLoyalty(l => ({ ...l, points_per_dollar: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-emerald-500 transition" />
              <p className="text-[11px] text-gray-400 mt-1">Higher = customers earn faster.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Redemption step (pts)</label>
              <input type="number" min="1" step="1"
                value={loyalty.min_redemption_points}
                onChange={e => setLoyalty(l => ({ ...l, min_redemption_points: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-emerald-500 transition" />
              <p className="text-[11px] text-gray-400 mt-1">Customers redeem in multiples of this.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">$ value per point</label>
              <input type="number" min="0.0001" step="0.0001"
                value={loyalty.points_to_dollar_value}
                onChange={e => setLoyalty(l => ({ ...l, points_to_dollar_value: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-emerald-500 transition" />
              <p className="text-[11px] text-gray-400 mt-1">e.g. 0.005 → 200 pts = $1 off.</p>
            </div>
          </div>
        )}

        {/* Live preview */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">PREVIEW</p>
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            Customer earns <b>{effectivePpd} pts</b> per $1 ·{' '}
            Redeem <b>{effectiveStep} pts</b> for <b>${(effectiveStep * effectivePV).toFixed(2)}</b> off ·{' '}
            Effective cashback <b>{pctBack}%</b>
          </p>
        </div>

        {/* Bonus week */}
        <div className="border-t border-gray-100 dark:border-neutral-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Bonus Promotion</h3>
            </div>
            <button type="button"
              onClick={() => setLoyalty(l => ({ ...l, bonus_active: !l.bonus_active }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${loyalty.bonus_active ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${loyalty.bonus_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          {loyalty.bonus_active && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Multiplier</label>
                <input type="number" min="1" max="10" step="0.5"
                  value={loyalty.bonus_multiplier}
                  onChange={e => setLoyalty(l => ({ ...l, bonus_multiplier: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-500 transition" />
                <p className="text-[11px] text-gray-400 mt-1">e.g. 2 = double points</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description (optional)</label>
                <input type="text" placeholder="Double points weekend!"
                  value={loyalty.bonus_description || ''}
                  onChange={e => setLoyalty(l => ({ ...l, bonus_description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-500 transition" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button type="button" onClick={handleSaveLoyalty} disabled={loyaltySaving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow hover:shadow-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {loyaltySaving ? 'Saving...' : <><Check className="w-4 h-4" />Save Loyalty Settings</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}