import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import ShopCard from '../../components/customer/ShopCard';
import { shopService } from '../../services/shopService';

export default function Home() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadShops();
  }, [filters]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopService.getShops(filters);
      setShops(data);
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-neutral-900 dark:to-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Discover Local Coffee Shops
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Order ahead, earn rewards, support local
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search coffee shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-600 text-lg"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Shop Discovery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No shops found. Try adjusting your search.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filters.search ? `Results for "${filters.search}"` : 'All Coffee Shops'}
              </h2>
              <span className="text-gray-500 dark:text-gray-400">
                {shops.length} {shops.length === 1 ? 'shop' : 'shops'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onClick={() => navigate(`/shops/${shop.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-neutral-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">☕</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Local Shops</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Support your favorite local coffee shops
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Earn Rewards</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get points and rewards with every order
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast Pickup</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Order ahead and skip the line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
