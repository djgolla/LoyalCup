import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useAnimation } from 'framer-motion';
import { Search, Coffee, Gift, Zap, Store, Users, TrendingUp, Smartphone, Award, Heart, Star, ArrowRight, MapPin, Clock, Sparkles, Download, Apple } from 'lucide-react';
import ShopCard from '../../components/customer/ShopCard';
import { shopService } from '../../services/shopService';
import { useAuth } from '../../context/AuthContext';

const FloatingCoffee = ({ delay = 0 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-20, 20, -20] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
    className="absolute text-6xl opacity-20"
  >
    ☕
  </motion.div>
);

const CountUpNumber = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}</span>;
};

const FeatureCard = ({ icon: Icon, title, description, color, delay }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } }
      }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-neutral-800 hover:border-amber-500/50 transition-all duration-300">
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className={`w-20 h-20 ${color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white text-center">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg text-center leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [shops, setShops] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.9]);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const data = await shopService.getShops({});
      setShops(data);
      const featured = data.filter(shop => shop.featured === true);
      setFeaturedShops(featured.length > 0 ? featured.slice(0, 6) : data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShopApplication = () => {
    if (isAuthenticated) {
      navigate('/shop-application');
    } else {
      navigate('/login?redirect=/shop-application');
    }
  };

  const handleDownloadApp = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/loyalcup', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=com.loyalcup', '_blank');
    } else {
      navigate('/download');
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-32 overflow-hidden">
        <FloatingCoffee delay={0} />
        <FloatingCoffee delay={1} />
        <FloatingCoffee delay={2} />
        
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-7xl mx-auto px-4 relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-8"
            >
              <div className="flex items-center gap-3 bg-white dark:bg-neutral-800 px-8 py-4 rounded-full shadow-2xl backdrop-blur-sm border border-amber-200 dark:border-amber-900">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Coffee className="w-6 h-6 text-amber-700" />
                </motion.div>
                <span className="text-sm font-bold text-gray-900 dark:text-white tracking-wide uppercase">
                  Supporting Local Coffee Shops
                </span>
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl lg:text-8xl font-black text-gray-900 dark:text-white mb-8 leading-tight"
            >
              Discover Local Coffee.{' '}
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 inline-block"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Stay Loyal.
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 mb-12 max-w-4xl mx-auto font-light leading-relaxed"
            >
              Order ahead, earn rewards, and support your favorite local coffee shops—all in one place.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(245, 158, 11, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadApp}
                className="group relative px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full text-xl font-bold shadow-2xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center justify-center gap-3">
                  <Smartphone className="w-6 h-6" />
                  Download App
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.div>
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShopApplication}
                className="px-10 py-5 bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 border-3 border-amber-700 dark:border-amber-600 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all"
              >
                List Your Shop
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 dark:text-gray-400 text-sm"
            >
              Available on iOS and Android
            </motion.p>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
      </div>

      <div className="py-20 bg-white dark:bg-neutral-900 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: 50, label: 'Local Shops', suffix: '+' },
              { num: 10, label: 'Happy Customers', suffix: 'K+' },
              { num: 25, label: 'Orders Placed', suffix: 'K+' },
              { num: 4.8, label: 'Average Rating', suffix: '★' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <motion.div 
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2"
                  whileHover={{ scale: 1.1 }}
                >
                  <CountUpNumber end={stat.num} />{stat.suffix}
                </motion.div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-32 bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNTk1MjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNGgtMnYyaDJ2LTJ6bTAtOGgydi0yaC0ydjJ6bS0yIDJ2Mmgydi0yaC0yem0yIDJoMnYtMmgtMnYyem0tMiAydjJoMnYtMmgtMnptNi00aDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block mb-6"
            >
              <div className="bg-amber-100 dark:bg-amber-900/20 px-6 py-3 rounded-full">
                <span className="text-amber-700 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">
                  Simple Process
                </span>
              </div>
            </motion.div>
            <h2 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Get your coffee fix in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              icon={Smartphone}
              title="Download the App"
              description="Get the LoyalCup app on iOS or Android and create your account in seconds"
              color="bg-gradient-to-br from-blue-500 to-cyan-500"
              delay={0.2}
            />
            <FeatureCard
              icon={Coffee}
              title="Browse & Order"
              description="Discover local shops, browse menus, and place your order ahead of time"
              color="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={0.4}
            />
            <FeatureCard
              icon={Gift}
              title="Earn Rewards"
              description="Get loyalty points with every purchase and redeem them for free drinks"
              color="bg-gradient-to-br from-purple-500 to-pink-500"
              delay={0.6}
            />
          </div>
        </div>
      </div>

      {featuredShops.length > 0 && (
        <div className="py-32 bg-white dark:bg-neutral-900">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6">
                Featured Shops
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-400 mb-4">
                Check out these popular local favorites
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-500">
                Download the app to order from any of these shops
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredShops.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  onClick={handleDownloadApp}
                  className="cursor-pointer"
                >
                  <ShopCard shop={shop} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadApp}
                className="bg-amber-700 text-white px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
              >
                <Download className="w-6 h-6" />
                Download App to Order
              </motion.button>
            </motion.div>
          </div>
        </div>
      )}

      <div className="py-32 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-black mb-6">
              Grow Your Business
            </h2>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto">
              Join other local coffee shops already thriving on our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Users, title: 'Reach More Customers', desc: 'Get discovered by coffee lovers in your area and beyond' },
              { icon: Store, title: 'Easy Menu Management', desc: 'Update your menu in real-time with our intuitive dashboard' },
              { icon: TrendingUp, title: 'Built-in Loyalty Program', desc: 'Keep customers coming back with automatic rewards' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/20 shadow-2xl"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <item.icon className="w-16 h-16 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="opacity-90 text-lg">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 25px 70px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShopApplication}
              className="bg-white text-amber-700 px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
            >
              Apply to Join LoyalCup
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="py-32 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Smartphone className="w-24 h-24 text-amber-700 mx-auto mb-8" />
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-8"
          >
            Ready to find your new favorite coffee spot?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-gray-600 dark:text-gray-400 mb-12"
          >
            Download the app and join thousands of coffee lovers supporting local businesses
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadApp}
            className="group relative bg-gradient-to-r from-amber-600 to-orange-600 text-white px-12 py-6 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative flex items-center gap-3">
              <Download className="w-6 h-6" />
              Download LoyalCup
              <ArrowRight className="w-6 h-6" />
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}