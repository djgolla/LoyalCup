import MenuItemCard from "./MenuItemCard";

export default function MenuSection({ category, items, shopId, shopName }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {category}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <MenuItemCard 
            key={item.id}
            item={item}
            shopId={shopId}
            shopName={shopName}
          />
        ))}
      </div>
    </section>
  );
}
