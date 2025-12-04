# LoyalCup Backend API

Backend API for LoyalCup - A loyalty-focused coffee shop ordering platform built with FastAPI and Supabase.

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **Supabase** - PostgreSQL database with built-in authentication
- **Pydantic** - Data validation using Python type annotations
- **Python-JOSE** - JWT token handling
- **Uvicorn** - ASGI server

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings & environment variables
│   ├── database.py          # Supabase client initialization
│   │
│   ├── models/              # Pydantic models for request/response
│   │   ├── user.py          # User/Profile models
│   │   ├── shop.py          # Shop, Menu models
│   │   ├── order.py         # Order models
│   │   └── loyalty.py       # Loyalty models
│   │
│   ├── schemas/             # Database schemas
│   │   └── base.py          # Common schema definitions
│   │
│   ├── routes/              # API endpoints
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User profile endpoints
│   │   ├── shops.py         # Shop CRUD endpoints
│   │   ├── menu.py          # Menu items & categories
│   │   ├── orders.py        # Order endpoints
│   │   └── loyalty.py       # Loyalty endpoints
│   │
│   ├── services/            # Business logic layer
│   │   ├── auth_service.py
│   │   ├── shop_service.py
│   │   ├── order_service.py
│   │   └── loyalty_service.py
│   │
│   └── utils/               # Helper utilities
│       ├── security.py      # JWT validation, role checking
│       └── exceptions.py    # Custom exceptions
│
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## Setup

### Prerequisites

- Python 3.11+
- Supabase project with PostgreSQL database
- Virtual environment (recommended)

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration (from Supabase)
JWT_SECRET=your-jwt-secret

# Application Configuration
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000","http://localhost:19006"]

# API Configuration (optional)
API_TITLE=LoyalCup API
API_VERSION=1.0.0
```

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run database migrations in Supabase:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the SQL script from `supabase/migrations/001_init.sql`

### Running the Server

Development mode with auto-reload:
```bash
uvicorn app.main:app --reload
```

Production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## Docker

Build the Docker image:
```bash
docker build -t loyalcup-backend .
```

Run the container:
```bash
docker run -p 8000:8000 --env-file .env loyalcup-backend
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Sign up a new user
- `POST /api/v1/auth/signin` - Sign in
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/{user_id}` - Get user by ID
- `GET /api/v1/users/` - List all users (admin only)

### Shops
- `POST /api/v1/shops/` - Create a shop
- `GET /api/v1/shops/` - List all shops
- `GET /api/v1/shops/{shop_id}` - Get shop by ID
- `PUT /api/v1/shops/{shop_id}` - Update shop
- `DELETE /api/v1/shops/{shop_id}` - Delete shop

### Menu
- `POST /api/v1/menu/categories` - Create menu category
- `GET /api/v1/menu/categories/{shop_id}` - List categories
- `POST /api/v1/menu/items` - Create menu item
- `GET /api/v1/menu/items/{shop_id}` - List menu items
- `GET /api/v1/menu/items/detail/{item_id}` - Get menu item
- `PUT /api/v1/menu/items/{item_id}` - Update menu item
- `DELETE /api/v1/menu/items/{item_id}` - Delete menu item

### Orders
- `POST /api/v1/orders/` - Create order
- `GET /api/v1/orders/` - List user's orders
- `GET /api/v1/orders/shop/{shop_id}` - List shop orders
- `GET /api/v1/orders/{order_id}` - Get order by ID
- `PUT /api/v1/orders/{order_id}` - Update order
- `POST /api/v1/orders/{order_id}/cancel` - Cancel order

### Loyalty
- `GET /api/v1/loyalty/balance/{shop_id}` - Get loyalty balance
- `GET /api/v1/loyalty/rewards/{shop_id}` - List rewards
- `POST /api/v1/loyalty/rewards` - Create reward
- `GET /api/v1/loyalty/transactions` - Get transaction history
- `POST /api/v1/loyalty/redeem/{reward_id}` - Redeem reward

## Database Schema

The database schema is defined in `supabase/migrations/001_init.sql` and includes:

- **profiles** - User profile data
- **shops** - Coffee shop information
- **menu_categories** - Menu categories per shop
- **menu_items** - Menu items
- **customization_templates** - Item customization options
- **orders** - Customer orders
- **order_items** - Items in each order
- **loyalty_balances** - User loyalty point balances
- **loyalty_rewards** - Available rewards
- **loyalty_transactions** - Loyalty point transaction history

## Development Notes

This is a learning project, so the code includes:
- Comprehensive type hints
- Detailed docstrings
- Clean separation of concerns (routes, services, models)
- Proper error handling
- Security best practices

## TODO

The following features are marked as not implemented and will be added in subsequent PRs:
- [ ] Supabase Auth integration (sign up, sign in, token refresh)
- [ ] Complete CRUD operations for all resources
- [ ] File upload for images (shop logos, menu items, avatars)
- [ ] Real-time order updates using Supabase Realtime
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Analytics and reporting
- [ ] Rate limiting
- [ ] Caching layer

## License

This project is for educational purposes.
