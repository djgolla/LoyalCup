import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import MenuSection from "../../components/customer/MenuSection";
import CartButton from "../../components/customer/CartButton";
import Loading from "../../components/Loading";
import { MapPin, Clock, Star } from "lucide-react";

export default function ShopDetail() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const [shop, setShop] = useState(null);
  const [menuItems, setMenuItems] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // fetch shop details
    fetch(`/api/shops/${shopId}`)
      .then((res) => res.json())
      .then((data) => setShop(data.shop));

    // fetch menu items for this shop
    fetch(`/api/shops/${shopId}/menu`)
      .then((res) => res.json())
      .then((data) => {
        setMenuItems(data.items || []);
        
        // extract unique categories
        const cats = [...new Set(data.items.map(item => item.category))];
        setCategories(cats);
      });
  }, [shopId]);

  if (!shop || !menuItems) return <Loading />;

  return (
    <div className="pb-24">
      {/* shop header */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden mb-6">
        {/* banner */}
        {shop.banner_url && (
          <img 
            src={shop.banner_url} 
            alt={shop.name}
            className="w-full h-48 object-cover"
          />
        )}
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* logo */}
            {shop.logo_url && (
              <img 
                src={shop.logo_url} 
                alt={shop.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {shop.name}
              </h1>
              
              <p className="text-gray-600 dark:text-neutral-400 mt-1">
                {shop.description}
              </p>

              {/* shop info */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600 dark:text-neutral-400">
                {shop.address && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {shop.address}
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  Open Now
                </div>
                
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  4.8
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* menu sections */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(item => item.category === category);
          return (
            <MenuSection 
              key={category}
              category={category}
              items={categoryItems}
              shopId={shopId}
              shopName={shop.name}
            />
          );
        })}
      </div>

      {/* floating cart button */}
      {cart.shopId === shopId && cart.items.length > 0 && (
        <CartButton onClick={() => navigate('/cart')} />
      )}
    </div>
  );
}
