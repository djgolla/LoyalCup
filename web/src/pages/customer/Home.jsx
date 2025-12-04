import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShopCard from "../../components/customer/ShopCard";
import SearchBar from "../../components/customer/SearchBar";
import Loading from "../../components/Loading";

export default function Home() {
  const [shops, setShops] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // fetch shops from API
    fetch("/api/shops")
      .then((res) => res.json())
      .then((data) => setShops(data.shops || []));
  }, []);

  if (!shops) return <Loading />;

  // filter shops by search term
  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Find Your Favorite Coffee Shop
        </h1>
        
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search shops..."
        />
      </div>

      {/* featured shops */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ⭐ Featured Shops
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.slice(0, 3).map((shop) => (
            <ShopCard 
              key={shop.id} 
              shop={shop}
              onClick={() => navigate(`/shop/${shop.id}`)}
            />
          ))}
        </div>
      </section>

      {/* all shops */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          All Shops
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map((shop) => (
            <ShopCard 
              key={shop.id} 
              shop={shop}
              onClick={() => navigate(`/shop/${shop.id}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
