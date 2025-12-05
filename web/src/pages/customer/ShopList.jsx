import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopCard from '../../components/customer/ShopCard';
import { shopService } from '../../services/shopService';

export default function ShopList() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopService.getShops();
      setShops(data);
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Coffee Shops Near You
      </h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shops...</p>
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No shops available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onClick={() => navigate(`/shops/${shop.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
