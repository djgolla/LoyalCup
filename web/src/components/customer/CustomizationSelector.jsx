export default function CustomizationSelector({ customizations, onChange }) {
  // simplified customization selector with common coffee options
  
  const sizeOptions = [
    { name: "Small", price: 0 },
    { name: "Medium", price: 0.50 },
    { name: "Large", price: 1.00 }
  ];

  const milkOptions = [
    { name: "Whole Milk", price: 0 },
    { name: "Oat Milk", price: 0.50 },
    { name: "Almond Milk", price: 0.50 },
    { name: "Soy Milk", price: 0.50 }
  ];

  const extraOptions = [
    { name: "Extra Shot", price: 1.00 },
    { name: "Whipped Cream", price: 0.50 },
    { name: "Caramel Drizzle", price: 0.50 }
  ];

  const toggleExtra = (extra) => {
    const exists = customizations.find(c => c.name === extra.name);
    if (exists) {
      onChange(customizations.filter(c => c.name !== extra.name));
    } else {
      onChange([...customizations, extra]);
    }
  };

  const selectOption = (option, type) => {
    // remove any existing option of this type
    const filtered = customizations.filter(c => 
      !sizeOptions.concat(milkOptions).find(o => o.name === c.name)
    );
    onChange([...filtered, option]);
  };

  return (
    <div className="space-y-4">
      {/* size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          Size
        </label>
        <div className="flex gap-2">
          {sizeOptions.map((size) => {
            const selected = customizations.find(c => c.name === size.name);
            return (
              <button
                key={size.name}
                onClick={() => selectOption(size, 'size')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    : 'border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                }`}
              >
                {size.name}
                {size.price > 0 && <span className="text-xs ml-1">+${size.price.toFixed(2)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* milk */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          Milk
        </label>
        <div className="grid grid-cols-2 gap-2">
          {milkOptions.map((milk) => {
            const selected = customizations.find(c => c.name === milk.name);
            return (
              <button
                key={milk.name}
                onClick={() => selectOption(milk, 'milk')}
                className={`px-4 py-2 rounded-lg border ${
                  selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                    : 'border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800'
                }`}
              >
                {milk.name}
                {milk.price > 0 && <span className="text-xs ml-1">+${milk.price.toFixed(2)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* extras */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
          Extras
        </label>
        <div className="space-y-2">
          {extraOptions.map((extra) => {
            const selected = customizations.find(c => c.name === extra.name);
            return (
              <label
                key={extra.name}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!selected}
                  onChange={() => toggleExtra(extra)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-neutral-300">
                  {extra.name} (+${extra.price.toFixed(2)})
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
