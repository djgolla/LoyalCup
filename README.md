# LoyalCup

[![Backend CI](https://github.com/djgolla/LoyalCup/workflows/Backend%20CI%2FCD/badge.svg)](https://github.com/djgolla/LoyalCup/actions)
[![Web CI](https://github.com/djgolla/LoyalCup/workflows/Web%20Frontend%20CI%2FCD/badge.svg)](https://github.com/djgolla/LoyalCup/actions)
[![Security Audit](https://github.com/djgolla/LoyalCup/workflows/Security%20Audit/badge.svg)](https://github.com/djgolla/LoyalCup/actions)

A full-stack coffee shop ordering platform with integrated loyalty rewards. Connects shop owners, workers, and customers through web and mobile applications.

## Features

### Customer Features
- Mobile and web applications for placing orders
- Browse and discover local coffee shops
- Customize orders with size, milk type, sweetness, and add-ons
- Real-time order status tracking
- Loyalty rewards program with point accumulation and redemption
- Shop and menu item reviews and ratings
- Gift card purchasing and redemption
- Coupon and discount code application
- Favorites list for shops and menu items

### Shop Owner Features
- Complete shop profile management and branding
- Menu builder with categories, items, pricing, and images
- Reusable customization templates for menu items
- Configurable loyalty program with points and rewards
- Worker account management and invitation system
- Analytics dashboard showing revenue, orders, and popular items
- Export reports in CSV and PDF formats
- Inventory tracking and stock management
- Promotional campaigns and discount creation
- Operating hours management including regular hours and closures

### Worker Features
- Real-time order queue management
- Order status updates and progression tracking
- Push notifications for new orders
- Daily performance summary and metrics

### Administrator Features
- Platform-wide analytics dashboard
- Shop application review and approval system
- User account management with role assignment
- Comprehensive audit logging for all administrative actions
- Security monitoring and platform management tools

## Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL via Supabase
- **Authentication:** JWT with Supabase Auth
- **Storage:** Supabase Storage for images
- **Email:** SendGrid integration
- **Monitoring:** Sentry error tracking
- **Logging:** Structured JSON logging
- **Rate Limiting:** SlowAPI middleware

### Web Frontend
- **Framework:** React 19 with Vite
- **Styling:** TailwindCSS
- **State Management:** Context API
- **Charts:** Chart.js
- **Routing:** React Router v6
- **API Client:** Supabase JS

### Mobile Application
- **Framework:** React Native with Expo
- **Navigation:** Expo Router (file-based)
- **API Client:** Axios and Supabase JS
- **Deployment:** EAS Build

### Infrastructure
- **CI/CD:** GitHub Actions
- **Web Hosting:** Vercel
- **Backend Hosting:** Railway
- **Database:** Supabase (PostgreSQL)
- **CDN:** CloudFlare

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase account
- npm or yarn

### Repository Setup
```bash
git clone https://github.com/djgolla/LoyalCup.git
cd LoyalCup
```

### Database Configuration
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in the SQL Editor in the following order:
   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/002_admin_features.sql`
   - `supabase/migrations/003_production_ready.sql`
   - `supabase/migrations/004_production_optimizations.sql`
   - `supabase/migrations/005_advanced_features.sql`

### Backend Setup
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

The backend API runs at `http://localhost:8000` with interactive documentation at `http://localhost:8000/api/docs`.

### Web Frontend Setup
```bash
cd web

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with API and Supabase URLs

# Start development server
npm run dev
```

The web application runs at `http://localhost:5173`.

### Mobile Application Setup
```bash
cd mobile/universal-coffee-shop

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with API and Supabase URLs

# Start Expo development server
npm start
```

Scan the QR code with the Expo Go app to run on a physical device.

## Project Structure

### Backend (`/backend`)
- **Routes:** API endpoints organized by feature (auth, shops, menu, orders, loyalty, admin)
- **Services:** Business logic layer separating concerns from route handlers
- **Models:** Pydantic models for request/response validation
- **Utils:** Security utilities, JWT validation, and exception handlers

### Web Frontend (`/web`)
- **Pages:** Application views organized by user role (customer, shop-owner, worker, admin)
- **Components:** Reusable UI components with navigation and common elements
- **Context:** State management for authentication and application data
- **Services:** API integration layer

### Mobile Application (`/mobile/universal-coffee-shop`)
- **App:** Screen components using Expo Router file-based routing
- **Components:** Reusable mobile UI components
- **Context:** Authentication and shopping cart state management
- **Services:** API service layer with Supabase integration

### Database (`/supabase`)
- **Migrations:** Sequential SQL migration files defining the database schema
- Includes tables for users, shops, menus, orders, loyalty, and administrative features

## Environment Variables

### Backend (`.env`)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
RATE_LIMIT_ENABLED=true
SENDGRID_API_KEY=your-sendgrid-key
SENTRY_DSN=your-sentry-dsn
```

### Web Frontend (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile Application (`.env`)
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing

### Backend
```bash
cd backend
pytest
```

### Web Frontend
```bash
cd web
npm test
```

### Mobile Application
```bash
cd mobile/universal-coffee-shop
npm test
```

## Security

The platform implements multiple security layers:

- **Authentication:** JWT tokens with Supabase Auth
- **Authorization:** Role-based access control (RBAC) for customers, workers, shop owners, and administrators
- **Rate Limiting:** 100 requests per minute per IP address
- **Input Validation:** Pydantic models on backend, validation hooks on frontend
- **SQL Injection Prevention:** Queries executed through Supabase client
- **XSS Protection:** React automatic escaping
- **HTTPS:** Required for production deployments
- **Error Tracking:** Sentry integration for monitoring
- **Security Audits:** Automated CodeQL scans via GitHub Actions

## Database Schema

The database includes the following table categories:

### Core Tables
- User profiles and authentication
- Shop information and settings
- Menu categories and items
- Order records and line items
- Loyalty balances, rewards, and transaction history

### Supporting Tables
- Operating hours and closures
- Reviews and ratings
- User favorites
- Promotional campaigns and coupons
- Gift cards
- Inventory management
- Push notification tokens

See `supabase/migrations/` for the complete schema definition.

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Customer Guide](CUSTOMER_GUIDE.md)** - Customer application usage
- **[Shop Owner Guide](SHOP_OWNER_GUIDE.md)** - Shop management features
- **[Worker Guide](WORKER_GUIDE.md)** - Order fulfillment process
- **[Admin Guide](ADMIN_GUIDE.md)** - Platform administration
