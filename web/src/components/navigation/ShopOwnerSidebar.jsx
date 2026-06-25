import { NavLink, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Menu as MenuIcon, FolderTree, Sliders,
  Settings as SettingsIcon, ShoppingBag, BarChart3, Award,
  LogOut, Lock, Star, CreditCard, MapPin, Coffee,
} from 'lucide-react';

export default function ShopOwnerSidebar() {
  const { shop, shops, selectedShopId, selectShop } = useShop();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const squareConnected = !!shop?.square_merchant_id;

  const base     = 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors duration-200';
  const active   = 'bg-orange-50 text-orange-700 font-black dark:bg-orange-950/30 dark:text-orange-300';
  const inactive = 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-neutral-800';
  const locked   = 'text-gray-400 dark:text-neutral-600 cursor-not-allowed pointer-events-none';

  const Link = ({ to, icon: Icon, children, requiresSquare = false }) => {
    const isLocked = requiresSquare && !squareConnected;
    if (isLocked) {
      return (
        <div className={`${base} ${locked}`}>
          <Icon size={18} />
          <span className="flex-1">{children}</span>
          <Lock size={13} className="opacity-50" />
        </div>
      );
    }
    return (
      <NavLink to={to} className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <Icon size={18} />
        {children}
      </NavLink>
    );
  };

  const Section = ({ children }) => (
    <p className="px-4 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
      {children}
    </p>
  );

  const statusBadge = shop ? (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      shop.status === 'active'
        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
    }`}>
      {shop.status}
    </span>
  ) : null;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-slate-200 p-4 dark:border-neutral-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#101827] text-orange-400">
            <Coffee className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-black text-slate-950 dark:text-white">LoyalCup</h1>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Owner</p>
          </div>
        </div>
        <p className="mb-1 truncate text-sm font-black text-slate-800 dark:text-gray-100">
          {shop?.name || 'My Coffee Shop'}
        </p>
        {statusBadge}
        {shops.length > 1 && (
          <label className="mt-3 block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
              <MapPin size={12} /> Location
            </span>
            <select
              value={selectedShopId || shop?.id || ''}
              onChange={(e) => selectShop(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-orange-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-gray-100"
            >
              {shops.map((ownerShop) => (
                <option key={ownerShop.id} value={ownerShop.id}>
                  {ownerShop.name || ownerShop.address || 'Unnamed location'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <Link to="/shop-owner/dashboard" icon={LayoutDashboard} requiresSquare>Dashboard</Link>

        <Section>Menu</Section>
        <Link to="/shop-owner/menu"           icon={MenuIcon}   requiresSquare>Menu Builder</Link>
        <Link to="/shop-owner/categories"     icon={FolderTree} requiresSquare>Categories</Link>
        <Link to="/shop-owner/customizations" icon={Sliders}    requiresSquare>Modifiers</Link>

        <Section>Operations</Section>
        <Link to="/shop-owner/orders"    icon={ShoppingBag} requiresSquare>Order Log</Link>
        <Link to="/shop-owner/reviews"   icon={Star}        requiresSquare>Reviews</Link>
        <Link to="/shop-owner/loyalty"   icon={Award}       requiresSquare>Loyalty</Link>
        <Link to="/shop-owner/analytics" icon={BarChart3}   requiresSquare>Analytics</Link>

        <Section>Settings</Section>
        <Link to="/shop-owner/settings"       icon={SettingsIcon}>Shop Settings</Link>
        <Link to="/shop-owner/connect-square" icon={CreditCard}>
          {squareConnected ? 'Square Connected' : 'Connect Square'}
        </Link>
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-neutral-800">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className={`${base} ${inactive} w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
