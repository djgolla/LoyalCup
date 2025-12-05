import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { shopService } from '../../services/shopService';
import { useCart } from '../../context/CartContext';

export default function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
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

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.base_price),
      shopId: id,
      shopName: shop?.name
    });
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
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Shop Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden mb-8">
        {/* Banner */}
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

        {/* Shop Info */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {shop.logo_url && (
              <img
                src={shop.logo_url}
                alt={`${shop.name} logo`}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-neutral-700"
              />
            )}
            <div>
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

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
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
        </div>
      </div>

      {/* Menu */}
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
              <div key={category.id}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-amber-600">
                  {category.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800 hover:border-amber-600 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg ml-4"
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-lg font-bold text-amber-700">
                          ${parseFloat(item.base_price).toFixed(2)}
                        </span>
                        {item.is_available ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition text-sm font-medium"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
