import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store, MapPin, Clock, Image as ImageIcon,
  Save, Upload, X, Check, Smartphone, Power, Timer, Printer
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
import { updateShop, uploadShopAsset } from '../../api/shops';
import { toast } from 'sonner';

const DEFAULT_HOURS = {
  monday:    { open: '09:00', close: '17:00', closed: false },
  tuesday:   { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday:  { open: '09:00', close: '17:00', closed: false },
  friday:    { open: '09:00', close: '17:00', closed: false },
  saturday:  { open: '10:00', close: '16:00', closed: false },
  sunday:    { open: '10:00', close: '16:00', closed: false },
};

const DAYS     = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_ABBR = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    const hh      = String(h).padStart(2, '0');
    const mm      = String(m).padStart(2, '0');
    const label12 = h === 0 ? `12:${mm} AM` : h < 12 ? `${h}:${mm} AM` : h === 12 ? `12:${mm} PM` : `${h-12}:${mm} PM`;
    TIME_OPTIONS.push({ value: `${hh}:${mm}`, label: label12 });
  }
}

async function geocodeAddress(address, city, state, zip) {
  const parts = [address, city, state, zip].filter(Boolean).join(', ');
  if (!parts.trim()) return null;
  try {
    const url  = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(parts)}`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'LoyalCup/1.0' } });
    const data = await res.json();
    if (data?.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

export default function ShopSettings() {
  const { shop, shopId, loadShop } = useShop();
  const [loading,    setLoading]   = useState(false);
  const [uploading,  setUploading] = useState(null);
  const [dragActive, setDragActive] = useState(null);

  const [formData, setFormData] = useState({
    name:                    '',
    description:             '',
    address:                 '',
    city:                    '',
    state:                   '',
    zip:                     '',
    phone:                   '',
    website:                 '',
    logo_url:                '',
    banner_url:              '',
    hours:                   DEFAULT_HOURS,
    mobile_ordering_enabled: true,
    avg_prep_time_minutes:   10,
  });

  const [savedAddress, setSavedAddress] = useState('');

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
        avg_prep_time_minutes:   shop.avg_prep_time_minutes   ?? 10,
      });
      setSavedAddress([shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', '));
    }
  }, [shop]);

  const handleImageUpload = async (file, type) => {
    if (!file || !shopId) return;
    try {
      setUploading(type);
      const { data: { session } } = await supabase.auth.getSession();
      const result = await uploadShopAsset(shopId, file, session?.access_token);
      const field = type === 'logo' ? 'logo_url' : 'banner_url';
      setFormData(prev => ({ ...prev, [field]: result.url }));
      toast.success('Image uploaded!');
    } catch {
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
    const source   = formData.hours[sourceDay];
    const newHours = { ...formData.hours };
    ['monday','tuesday','wednesday','thursday','friday'].forEach(d => { newHours[d] = { ...source }; });
    setFormData(prev => ({ ...prev, hours: newHours }));
    toast.success('Hours applied to weekdays');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate prep time (1–120 min)
    const prep = parseInt(formData.avg_prep_time_minutes, 10);
    if (isNaN(prep) || prep < 1 || prep > 120) {
      toast.error('Average prep time must be between 1 and 120 minutes.');
      return;
    }

    try {
      setLoading(true);

      const newAddressStr = [formData.address, formData.city, formData.state, formData.zip]
        .filter(Boolean).join(', ');

      let geoUpdate = {};
      const missingCoords = shop?.lat == null && shop?.lng == null;

      if (newAddressStr && (newAddressStr !== savedAddress || missingCoords)) {
        toast.loading('Looking up location coordinates…', { id: 'geo' });
        const coords = await geocodeAddress(
          formData.address, formData.city, formData.state, formData.zip
        );
        toast.dismiss('geo');
        if (coords) {
          geoUpdate = { lat: coords.lat, lng: coords.lng };
        } else {
          toast.warning('Could not find coordinates for this address. The Nearby filter may not include your shop until the address is corrected.');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      await updateShop(shopId, {
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
        avg_prep_time_minutes:   prep,
        ...geoUpdate,
      }, session?.access_token);

      setSavedAddress(newAddressStr);
      toast.success('Settings saved!');
      loadShop();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

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
              <Power className="w-4 h-4 shrink-0" />
              Customers will see an "Ordering unavailable" message in the app. Save settings to apply.
            </div>
          )}
        </motion.div>

        {/* ── Prep Time (REQUIRED — drives the customer ETA) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/20 shrink-0">
              <Timer className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Average Prep Time <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                When a customer orders, we tell them their drink will be ready in about this long.
                Set it to match how long a typical mobile order takes at your busiest realistic pace —
                it's better to slightly over-estimate than leave customers waiting.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={formData.avg_prep_time_minutes}
                  onChange={e => setFormData(prev => ({ ...prev, avg_prep_time_minutes: e.target.value }))}
                  className="w-28 px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-amber-300 dark:border-amber-700 rounded-xl focus:outline-none focus:border-amber-500 transition font-bold text-lg"
                />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">minutes</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-2">
                Preview: “Order placed! {formData.name || 'Your shop'} will have it ready in about {formData.avg_prep_time_minutes || 10} minutes.”
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Mobile Order Printing (Square auto-print guidance) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/20 shrink-0">
              <Printer className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">How Mobile Orders Reach You</h2>
              <p className="text-sm text-gray-500 mb-2">
                Every mobile order is sent straight into your Square account and shows up in your
                <strong> Square Orders</strong>, clearly marked <strong>“MOBILE”</strong> on the ticket — just like a normal order.
              </p>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-1">✅ One-time setup: turn on auto-print</p>
                In your Square hardware/printer settings, enable <strong>automatic printing for online orders</strong>.
                Then every LoyalCup order prints at your counter automatically — your baristas just make it and hand it over.
                No extra screen, no status buttons to tap.
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Shop Images ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" /> Shop Images
          </h2>

          {/* Banner vs Logo explanation */}
          <div className="mb-5 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Both images are <strong>optional</strong> — your shop goes live either way. But uploading both makes a big difference in how you look to customers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="font-bold text-amber-800 dark:text-amber-400 mb-1">📸 Banner</p>
                <p className="text-amber-700 dark:text-amber-500 leading-relaxed">
                  The wide card header image customers see when scrolling. Think storefront photo or your best drink shot.<br />
                  <span className="font-semibold">Recommended: 1200×400px (3:1 landscape)</span>
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                <p className="font-bold text-blue-800 dark:text-blue-400 mb-1">🔵 Logo</p>
                <p className="text-blue-700 dark:text-blue-500 leading-relaxed">
                  Your brand mark. Shows as a small circle badge on the card and the big circle at the top of your shop page.<br />
                  <span className="font-semibold">Recommended: 400×400px (square)</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { type: 'logo',   label: 'Logo',   field: 'logo_url',   aspect: 'w-32 h-32 mx-auto object-cover rounded-xl' },
              { type: 'banner', label: 'Banner', field: 'banner_url', aspect: 'w-full h-32 object-cover rounded-xl' },
            ].map(({ type, label, field, aspect }) => (
              <div key={type}>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{label}</label>
                <div
                  onDragEnter={e => handleDrag(e, type)} onDragLeave={e => handleDrag(e, type)}
                  onDragOver={e => handleDrag(e, type)} onDrop={e => handleDrop(e, type)}
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
                placeholder="Tell customers what makes your shop special..."
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" /> Location
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Your address is used to show your shop in the <strong>Nearby</strong> filter in the app. Make sure it's accurate — coordinates are looked up automatically when you save.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Street Address</label>
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
                  <button type="button"
                    onClick={() => handleHoursChange(day, 'closed', !h.closed)}
                    className={`rounded-full transition-colors shrink-0 ${h.closed ? 'bg-red-400' : 'bg-green-500'}`}
                    style={{ height: '18px', width: '32px', minWidth: '32px', position: 'relative' }}
                  >
                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${h.closed ? 'left-0.5' : 'left-[14px]'}`} />
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
                        className="text-[10px] px-2 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-500 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition font-semibold">
                        M-F
                      </button>
                      <button type="button" onClick={() => applyToAll(day)} title="Apply to all days"
                        className="text-[10px] px-2 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-500 rounded-lg hover:bg-amber-100 hover:text-amber-700 transition font-semibold">
                        All
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Save */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-end">
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50">
            {loading ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Save className="w-5 h-5" /></motion.div>Saving...</>
            ) : (
              <><Check className="w-5 h-5" />Save Settings</>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}
