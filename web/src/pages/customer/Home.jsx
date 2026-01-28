import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Coffee, Gift, Zap, Store, Users, TrendingUp } from 'lucide-react';
import ShopCard from '../../components/customer/ShopCard';
import { shopService } from '../../services/shopService';

export default function Home() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
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
      // Get featured shops (if featured field exists, otherwise show first 6)
      const featured = data.filter(shop => shop.featured === true);
      setFeaturedShops(featured.length > 0 ? featured.slice(0, 6) : data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters({ ...filters, search: searchQuery });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              DISCOVER LOCAL <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                STAY LOYAL
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Your favorite local coffee shops, all in one place. Order ahead, earn rewards, support local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/shops')}
                className="px-8 py-4 bg-amber-700 text-white rounded-full hover:bg-amber-800 transition text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Order Now
              </button>
              <button
                onClick={() => navigate('/shop-application')}
                className="px-8 py-4 bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 border-2 border-amber-700 dark:border-amber-600 rounded-full hover:bg-amber-50 dark:hover:bg-neutral-700 transition text-lg font-semibold"
              >
                List Your Shop
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
              <input
                type="text"
                placeholder="Search coffee shops near you..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-5 rounded-full border-2 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-600 text-lg shadow-lg"
              />
            </div>
          </form>
        </div>
      </div>

      {/* How It Works (Customers) */}
      <div className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get your coffee fix in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                Browse Local Shops
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Discover amazing coffee shops in your area with detailed menus and reviews
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-green-700 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                Order Ahead
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Skip the line by placing your order ahead of time and pick it up when ready
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-purple-700 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                Earn Rewards
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Get loyalty points with every purchase and redeem them for free drinks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Shops */}
      {featuredShops.length > 0 && (
        <div className="py-20 bg-gray-50 dark:bg-neutral-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Shops
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Check out these popular local favorites
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredShops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onClick={() => navigate(`/shops/${shop.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* For Shop Owners Section */}
      <div className="py-20 bg-gradient-to-br from-amber-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Grow Your Business with LoyalCup
            </h2>
            <p className="text-xl lg:text-2xl mb-8 opacity-90">
              Join other local coffee shops already on our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Reach More Customers</h3>
              <p className="opacity-90">
                Get discovered by coffee lovers in your area and beyond
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Store className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Menu Management</h3>
              <p className="opacity-90">
                Update your menu in real-time with our intuitive dashboard
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Built-in Loyalty Program</h3>
              <p className="opacity-90">
                Keep customers coming back with automatic rewards
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/shop-application')}
              className="px-8 py-4 bg-white text-amber-700 rounded-full hover:bg-gray-100 transition text-lg font-semibold shadow-xl"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* All Shops Grid */}
      <div className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading shops...</p>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-12">
              <Coffee size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No shops found. Try adjusting your search.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {filters.search ? `Results for "${filters.search}"` : 'All Coffee Shops'}
                </h2>
                <span className="text-gray-500 dark:text-gray-400 text-lg">
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
      </div>
    </div>
  );
}
