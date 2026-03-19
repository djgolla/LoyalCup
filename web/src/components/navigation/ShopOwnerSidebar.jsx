import { NavLink, useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Menu as MenuIcon, FolderTree, Sliders,
  Settings as SettingsIcon, ShoppingBag, BarChart3, Award,
  LogOut, Lock, Star, CreditCard, Users,
} from 'lucide-react';

export default function ShopOwnerSidebar() {
  const { shop } = useShop();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const squareConnected = !!shop?.square_merchant_id;

  const base     = 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm';
  const active   = 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold';
  const inactive = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800';
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
    <aside className="w-64 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-neutral-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800">
        <h1 className="text-xl font-semibold text-amber-700">Shop Owner</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
          {shop?.name || 'My Coffee Shop'}
        </p>
        {statusBadge}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <Link to="/shop-owner/dashboard" icon={LayoutDashboard} requiresSquare>Dashboard</Link>

        <Section>Menu</Section>
        <Link to="/shop-owner/menu"            icon={MenuIcon}   requiresSquare>Menu Builder</Link>
        <Link to="/shop-owner/categories"      icon={FolderTree} requiresSquare>Categories</Link>
        <Link to="/shop-owner/customizations"  icon={Sliders}    requiresSquare>Modifiers</Link>

        <Section>Operations</Section>
        <Link to="/shop-owner/orders"    icon={ShoppingBag} requiresSquare>Orders</Link>
        <Link to="/shop-owner/reviews"   icon={Star}        requiresSquare>Reviews</Link>
        <Link to="/shop-owner/loyalty"   icon={Award}       requiresSquare>Loyalty</Link>
        <Link to="/shop-owner/workers"   icon={Users}       requiresSquare>Workers</Link>
        <Link to="/shop-owner/analytics" icon={BarChart3}   requiresSquare>Analytics</Link>

        <Section>Settings</Section>
        <Link to="/shop-owner/settings"       icon={SettingsIcon}>Shop Settings</Link>
        <Link to="/shop-owner/connect-square" icon={CreditCard}>
          {squareConnected ? 'Square Connected ✓' : 'Connect Square'}
        </Link>
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-neutral-800">
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