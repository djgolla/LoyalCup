import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Smartphone, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopService } from '../../services/shopService';

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopData();
  }, [id]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const [shopData, menuData] = await Promise.all([
        shopService.getShop(id),
        shopService.getShopMenu(id)
      ]);
      setShop(shopData);
      setMenu(menuData);
    } catch (error) {
      console.error('Failed to load shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadApp = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/loyalcup', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=com.loyalcup', '_blank');
    } else {
      navigate('/download');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shop...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Shop not found.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-amber-700 hover:text-amber-800"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden mb-8"
      >
        {shop.banner_url ? (
          <img
            src={shop.banner_url}
            alt={shop.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
            <span className="text-8xl">☕</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {shop.logo_url && (
              <img
                src={shop.logo_url}
                alt={`${shop.name} logo`}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {shop.name}
              </h1>
              {shop.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {shop.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            {shop.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>
                  {shop.address}
                  {shop.city && `, ${shop.city}`}
                  {shop.state && `, ${shop.state}`}
                </span>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{shop.phone}</span>
              </div>
            )}
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Smartphone className="w-16 h-16 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Want to order from {shop.name}?</h3>
            <p className="mb-6 opacity-90">Download the LoyalCup app to place your order and earn rewards</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadApp}
              className="bg-white text-amber-700 px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition inline-flex items-center gap-3"
            >
              <Download className="w-5 h-5" />
              Download App
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Menu</h2>

        {menu.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
            <p className="text-gray-600 dark:text-gray-400">
              No menu items available at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {menu.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-amber-600">
                  {category.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items?.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:border-amber-600 transition shadow-lg"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-amber-700">
                            ${(parseFloat(item.base_price) || 0).toFixed(2)}
                          </span>
                          <button
                            onClick={handleDownloadApp}
                            className="text-sm text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                          >
                            Order in App
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}