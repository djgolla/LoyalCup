# LoyalCup ☕

**Production-ready coffee shop ordering platform with integrated loyalty rewards**

[![Backend CI](https://github.com/djgolla/LoyalCup/workflows/Backend%20CI%2FCD/badge.svg)](https://github.com/djgolla/LoyalCup/actions)
[![Web CI](https://github.com/djgolla/LoyalCup/workflows/Web%20Frontend%20CI%2FCD/badge.svg)](https://github.com/djgolla/LoyalCup/actions)
[![Security Audit](https://github.com/djgolla/LoyalCup/workflows/Security%20Audit/badge.svg)](https://github.com/djgolla/LoyalCup/actions)

LoyalCup is a complete platform connecting coffee shop owners, workers, and customers through a seamless ordering and loyalty rewards experience. Built with modern technologies and production-ready features.

## ✨ Features

### For Customers
- 📱 **Mobile & Web Apps** - Order from anywhere
- ☕ **Browse Shops** - Discover local coffee shops
- 🎨 **Customize Orders** - Size, milk type, sweetness, add-ons
- ⏱️ **Order Tracking** - Real-time status updates
- 🎁 **Loyalty Rewards** - Earn points, redeem rewards
- ⭐ **Reviews & Ratings** - Share your experience
- 💳 **Gift Cards** - Purchase and redeem
- 🎟️ **Coupons** - Apply discount codes
- ❤️ **Favorites** - Save your go-to shops and drinks

### For Shop Owners
- 🏪 **Shop Management** - Complete profile and branding
- 📋 **Menu Builder** - Categories, items, pricing, images
- 🎛️ **Customization Templates** - Reusable customization options
- 💰 **Loyalty Program** - Configure points and rewards
- 👥 **Worker Management** - Invite and manage staff
- 📊 **Analytics** - Revenue, orders, popular items
- 📈 **Reports** - Export data (CSV, PDF)
- 📦 **Inventory Tracking** - Monitor stock levels
- 🎯 **Promotions** - Create campaigns and discounts
- ⏰ **Hours Management** - Regular hours and closures

### For Workers
- 📲 **Order Queue** - Real-time order management
- ✅ **Status Updates** - Track order progression
- 🔔 **Notifications** - New order alerts
- 📊 **Daily Summary** - Performance tracking

### For Administrators
- 👑 **Platform Dashboard** - System-wide analytics
- ✓ **Shop Approval** - Review applications
- 👥 **User Management** - Roles and permissions
- 📜 **Audit Logs** - Track all actions
- 🛡️ **Security** - Monitor and manage platform

## 🏗️ Architecture

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** JWT with Supabase Auth
- **Storage:** Supabase Storage for images
- **Email:** SendGrid integration
- **Monitoring:** Sentry error tracking
- **Logging:** Structured JSON logging
- **Rate Limiting:** SlowAPI middleware

### Web Frontend
- **Framework:** React 19 with Vite
- **Styling:** TailwindCSS
- **State:** Context API
- **Charts:** Chart.js
- **Routing:** React Router v6
- **API Client:** Supabase JS

### Mobile App
- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based)
- **API Client:** Axios + Supabase JS
- **Deployment:** EAS Build

### Infrastructure
- **CI/CD:** GitHub Actions
- **Hosting:** Vercel (web), Railway (backend)
- **Database:** Supabase (PostgreSQL)
- **CDN:** CloudFlare (recommended)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase account
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/djgolla/LoyalCup.git
cd LoyalCup
```

### 2. Database Setup
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in SQL Editor (in order):
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_admin_features.sql`
   - `supabase/migrations/003_production_ready.sql`
   - `supabase/migrations/004_production_optimizations.sql`
   - `supabase/migrations/005_advanced_features.sql`

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start server
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`  
API docs at `http://localhost:8000/api/docs`

### 4. Web Frontend Setup
```bash
cd web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API and Supabase URLs

# Start dev server
npm run dev
```

Web app runs at `http://localhost:5173`

### 5. Mobile App Setup
```bash
cd mobile/universal-coffee-shop

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with API and Supabase URLs

# Start Expo
npm start
```

Scan QR code with Expo Go app to run on device.

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Customer Guide](CUSTOMER_GUIDE.md)** - How to use the app as a customer
- **[Shop Owner Guide](SHOP_OWNER_GUIDE.md)** - Managing your coffee shop
- **[Worker Guide](WORKER_GUIDE.md)** - Fulfilling orders
- **[Admin Guide](ADMIN_GUIDE.md)** - Platform administration

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Web Tests
```bash
cd web
npm test
```

### Mobile Tests
```bash
cd mobile/universal-coffee-shop
npm test
```

## 🔒 Security

- **Authentication:** JWT tokens with Supabase Auth
- **Authorization:** Role-based access control (RBAC)
- **Rate Limiting:** 100 requests/minute per IP
- **Input Validation:** Pydantic models (backend), validation hooks (frontend)
- **SQL Injection:** Prevented via Supabase client
- **XSS Protection:** React auto-escaping
- **HTTPS:** Required in production
- **Error Tracking:** Sentry integration
- **Security Audits:** CodeQL GitHub Actions

## 📊 Database Schema

### Core Tables
- **profiles** - User accounts and roles
- **shops** - Coffee shop information
- **menu_categories** - Menu organization
- **menu_items** - Products and pricing
- **orders** - Order records
- **order_items** - Order line items
- **loyalty_balances** - Points per user/shop
- **loyalty_rewards** - Redeemable rewards
- **loyalty_transactions** - Point history

### Advanced Tables
- **shop_hours** - Regular operating hours
- **shop_closures** - Holidays and special closures
- **shop_reviews** - Customer ratings and reviews
- **user_favorites** - Saved shops and items
- **campaigns** - Promotional campaigns
- **coupons** - Discount codes
- **gift_cards** - Gift card management
- **inventory** - Stock tracking
- **push_tokens** - Mobile notification tokens

See [supabase/migrations/](supabase/migrations/) for complete schema.

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
RATE_LIMIT_ENABLED=true
SENDGRID_API_KEY=your-sendgrid-key
SENTRY_DSN=your-sentry-dsn
```

**Web (.env)**
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Mobile (.env)**
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- **Python:** Black formatter, flake8 linter
- **JavaScript/TypeScript:** ESLint
- **Commits:** Conventional commits format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **FastAPI** - High-performance API framework
- **React** - UI framework
- **Expo** - Mobile development platform
- **TailwindCSS** - Utility-first CSS

## 📧 Contact

- **Website:** https://loyalcup.com
- **Email:** support@loyalcup.com
- **GitHub:** https://github.com/djgolla/LoyalCup
- **Issues:** https://github.com/djgolla/LoyalCup/issues

## 🗺️ Roadmap

### Q1 2026
- ✅ Complete production infrastructure
- ✅ CI/CD pipelines
- ✅ Comprehensive documentation
- 🔄 Mobile app iOS/Android release
- 🔄 Payment integration (Stripe)

### Q2 2026
- 📱 Push notifications
- 🌐 Multi-language support
- 🎨 Dark mode
- 📊 Advanced analytics dashboard
- 🔗 Third-party integrations

### Q3 2026
- 🤖 AI-powered recommendations
- 📍 Advanced geolocation features
- 💬 In-app chat support
- 🎯 Personalized marketing campaigns

---

**Built with ☕ and ❤️ by the LoyalCup Team**

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** February 2026
