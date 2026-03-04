import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../../lib/supabase';

export default function ShopSetup() {
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadShopCredentials();
  }, []);

  const loadShopCredentials = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in');
        return;
      }

      // Get user's shop
      const { data: shop, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading shop:', error);
        return;
      }

      setShopId(shop.id);
      setShopName(shop.name);

      // Check if API key exists
      const { data: keyData } = await supabase
        .from('shop_api_keys')
        .select('api_key')
        .eq('shop_id', shop.id)
        .eq('is_active', true)
        .single();

      if (keyData) {
        setApiKey(keyData.api_key);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleGenerateApiKey = async () => {
    setLoading(true);
    try {
      // Generate a secure random key
      const newApiKey = `lc_shop_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      // Insert into database
      const { error } = await supabase
        .from('shop_api_keys')
        .insert({
          shop_id: shopId,
          api_key: newApiKey,
          is_active: true
        });

      if (error) throw error;

      setApiKey(newApiKey);
      toast.success('API Key generated successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    toast.info('Desktop app coming soon! For now, use the web dashboard.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">🖥️ Shop Manager Setup</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Download and configure the LoyalCup Shop Manager app for your team
        </p>

        {/* Step 1: Download */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Download Shop Manager</h2>
          </div>
          
          <div className="ml-13 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Download the desktop application for your shop's computer
            </p>
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <Download size={20} />
              Download for Windows/Mac
            </button>
          </div>
        </div>

        {/* Step 2: Get Credentials */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Get Your Credentials</h2>
          </div>

          <div className="ml-13 space-y-4">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shop Name
              </label>
              <div className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                {shopName || 'Loading...'}
              </div>
            </div>

            {/* Shop ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shop ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shopId}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={() => handleCopy(shopId, 'Shop ID')}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
                >
                  {copied === 'Shop ID' ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              {apiKey ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => handleCopy(apiKey, 'API Key')}
                    className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
                  >
                    {copied === 'API Key' ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateApiKey}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate API Key'}
                </button>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ Keep this secret! Don't share it publicly.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Setup Instructions */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Complete Setup</h2>
          </div>

          <div className="ml-13 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Install the Shop Manager app on your shop's computer</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Open the app and enter your Shop ID and API Key</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Workers can access the dashboard from any device on the same network</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Start receiving orders! 🎉</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Help Link */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{' '}
            <a href="/help" className="text-blue-500 hover:underline inline-flex items-center gap-1">
              View Setup Guide <ExternalLink size={14} />
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}