import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Store, MapPin, Clock, Image as ImageIcon,
  Save, Upload, X, Check, Globe
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';
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

export default function ShopSettings() {
  const { shop, shopId, loadShop } = useShop();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: '',
    logo_url: '',
    banner_url: '',
    hours: DEFAULT_HOURS,
  });

  useEffect(() => {
    if (shop) {
      setFormData(prev => ({
        name:        shop.name        || '',
        description: shop.description || '',
        address:     shop.address     || '',
        city:        shop.city        || '',
        state:       shop.state       || '',
        zip:         shop.zip         || '',
        phone:       shop.phone       || '',
        website:     shop.website     || '',
        logo_url:    shop.logo_url    || '',
        banner_url:  shop.banner_url  || '',
        hours:       shop.hours       || prev.hours,
      }));
    }
  }, [shop]);

  const handleImageUpload = async (file, type) => {
    if (!file || !shopId) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-images')
        .getPublicUrl(fileName);

      const field = type === 'logo' ? 'logo_url' : 'banner_url';
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleImageUpload(e.dataTransfer.files[0], type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } = await supabase
        .from('shops')
        .update({
          name:        formData.name,
          description: formData.description || null,
          address:     formData.address     || null,
          city:        formData.city        || null,
          state:       formData.state       || null,
          zip:         formData.zip         || null,
          phone:       formData.phone       || null,
          website:     formData.website     || null,
          logo_url:    formData.logo_url    || null,
          banner_url:  formData.banner_url  || null,
          hours:       formData.hours,
          updated_at:  new Date().toISOString(),
        })
        .eq('id', shopId);

      if (error) throw error;

      toast.success('Settings saved!');
      loadShop();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value },
      },
    }));
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
          Shop Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your shop information and preferences
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Shop Images ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            Shop Images
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Logo</label>
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={(e) => handleDrop(e, 'logo')}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-300 dark:border-neutral-700'
                }`}
              >
                {formData.logo_url ? (
                  <div className="relative">
                    <img src={formData.logo_url} alt="Logo"
                      className="w-32 h-32 object-cover rounded-xl mx-auto" />
                    <button type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                      {uploading ? 'Uploading...' : 'Drop logo here'}
                    </p>
                    <label className="inline-block px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold cursor-pointer hover:bg-amber-600 transition text-sm">
                      Choose File
                      <input type="file" accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                        className="hidden" disabled={uploading} />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Banner Image</label>
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={(e) => handleDrop(e, 'banner')}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${
                  dragActive
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-300 dark:border-neutral-700'
                }`}
              >
                {formData.banner_url ? (
                  <div className="relative">
                    <img src={formData.banner_url} alt="Banner"
                      className="w-full h-32 object-cover rounded-xl" />
                    <button type="button"
                      onClick={() => setFormData(prev => ({ ...prev, banner_url: '' }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                      {uploading ? 'Uploading...' : 'Drop banner image here'}
                    </p>
                    <label className="inline-block px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold cursor-pointer hover:bg-amber-600 transition text-sm">
                      Choose File
                      <input type="file" accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                        className="hidden" disabled={uploading} />
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Basic Information ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-600" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Shop Name *</label>
              <input type="text" value={formData.name} required
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea value={formData.description} rows="3"
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition resize-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
              <input type="url" value={formData.website} placeholder="https://..."
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </motion.div>

        {/* ── Location ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-600" />
            Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Address</label>
              <input type="text" value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">City</label>
              <input type="text" value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">State</label>
              <input type="text" value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">ZIP Code</label>
              <input type="text" value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition" />
            </div>
          </div>
        </motion.div>

        {/* ── Business Hours ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            Business Hours
          </h2>

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="w-32">
                  <p className="font-bold text-gray-900 dark:text-white capitalize">{day}</p>
                </div>

                {formData.hours[day].closed ? (
                  <div className="flex-1">
                    <span className="text-red-600 font-semibold">Closed</span>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-4">
                    <input type="time" value={formData.hours[day].open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-500 transition" />
                    <span className="text-gray-600 dark:text-gray-400">to</span>
                    <input type="time" value={formData.hours[day].close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-500 transition" />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.hours[day].closed}
                    onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Closed</span>
                </label>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Save Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <motion.button
            type="submit" disabled={loading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <motion.div animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Save className="w-5 h-5" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Settings
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}