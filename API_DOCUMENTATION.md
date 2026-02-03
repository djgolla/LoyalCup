# LoyalCup API Documentation

Complete API reference for the LoyalCup backend.

**Base URL:** `https://api.loyalcup.com`  
**API Version:** 1.0.0  
**Authentication:** JWT Bearer tokens

## Table of Contents
- [Authentication](#authentication)
- [Users API](#users-api)
- [Shops API](#shops-api)
- [Menu API](#menu-api)
- [Orders API](#orders-api)
- [Loyalty API](#loyalty-api)
- [Admin API](#admin-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview
LoyalCup uses JWT (JSON Web Token) authentication powered by Supabase Auth.

### Get Access Token
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

### Using the Token
Include in all authenticated requests:
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Endpoints

#### Sign Up
```http
POST /api/v1/auth/signup
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

#### Sign Out
```http
POST /api/v1/auth/logout
Authorization: Bearer YOUR_TOKEN
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
```

---

## Users API

### Get Current User Profile
```http
GET /api/v1/users/me
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "role": "customer",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Update Profile
```http
PATCH /api/v1/users/me
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "avatar_url": "https://..."
}
```

### Get User by ID (Admin only)
```http
GET /api/v1/users/{user_id}
Authorization: Bearer ADMIN_TOKEN
```

---

## Shops API

### List Shops
```http
GET /api/v1/shops?city=Seattle&status=active&limit=20&offset=0
```

**Query Parameters:**
- `city` (optional) - Filter by city
- `status` (optional) - Filter by status (active, pending, suspended)
- `search` (optional) - Full-text search
- `limit` (optional) - Number of results (default: 20, max: 100)
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "shops": [
    {
      "id": "uuid",
      "name": "Java Junction",
      "description": "Best coffee in town",
      "logo_url": "https://...",
      "banner_url": "https://...",
      "address": "123 Main St",
      "city": "Seattle",
      "state": "WA",
      "lat": 47.6062,
      "lng": -122.3321,
      "phone": "(206) 555-1234",
      "average_rating": 4.8,
      "review_count": 127,
      "loyalty_points_per_dollar": 10,
      "status": "active",
      "hours": {...}
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### Get Shop by ID
```http
GET /api/v1/shops/{shop_id}
```

### Create Shop Application
```http
POST /api/v1/shops
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "name": "My Coffee Shop",
  "description": "Artisan coffee and pastries",
  "address": "456 Oak Ave",
  "city": "Portland",
  "state": "OR",
  "phone": "(503) 555-5678",
  "loyalty_points_per_dollar": 10
}
```

### Update Shop (Owner only)
```http
PUT /api/v1/shops/{shop_id}
Authorization: Bearer OWNER_TOKEN
```

### Delete Shop (Owner/Admin only)
```http
DELETE /api/v1/shops/{shop_id}
Authorization: Bearer TOKEN
```

### Get Shop Analytics (Owner only)
```http
GET /api/v1/shops/{shop_id}/analytics
Authorization: Bearer OWNER_TOKEN
```

**Response:**
```json
{
  "total_orders": 1523,
  "total_revenue": 15234.50,
  "orders_today": 47,
  "revenue_today": 523.25,
  "avg_order_value": 10.01,
  "top_items": [...]
}
```

---

## Menu API

### List Menu Categories
```http
GET /api/v1/shops/{shop_id}/menu/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "name": "Coffee",
      "display_order": 0
    },
    {
      "id": "uuid",
      "shop_id": "uuid",
      "name": "Pastries",
      "display_order": 1
    }
  ]
}
```

### Create Category (Owner only)
```http
POST /api/v1/shops/{shop_id}/menu/categories
Authorization: Bearer OWNER_TOKEN
```

**Request Body:**
```json
{
  "name": "Sandwiches",
  "display_order": 2
}
```

### List Menu Items
```http
GET /api/v1/shops/{shop_id}/menu/items?category_id=uuid
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "category_id": "uuid",
      "name": "Cappuccino",
      "description": "Espresso with steamed milk",
      "base_price": 4.50,
      "image_url": "https://...",
      "is_available": true,
      "dietary_tags": ["vegetarian"],
      "allergens": ["dairy"],
      "calories": 120,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Create Menu Item (Owner only)
```http
POST /api/v1/shops/{shop_id}/menu/items
Authorization: Bearer OWNER_TOKEN
```

**Request Body:**
```json
{
  "category_id": "uuid",
  "name": "Latte",
  "description": "Espresso with steamed milk",
  "base_price": 4.75,
  "image_url": "https://...",
  "dietary_tags": ["vegetarian"],
  "allergens": ["dairy"],
  "calories": 150
}
```

### Update Menu Item (Owner only)
```http
PUT /api/v1/shops/{shop_id}/menu/items/{item_id}
Authorization: Bearer OWNER_TOKEN
```

### Toggle Item Availability (Owner/Worker)
```http
PATCH /api/v1/shops/{shop_id}/menu/items/{item_id}/availability
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "is_available": false
}
```

### List Customization Templates
```http
GET /api/v1/shops/{shop_id}/customizations
```

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "name": "Size",
      "type": "single_select",
      "is_required": true,
      "options": [
        {"name": "Small", "price": 0.00},
        {"name": "Medium", "price": 0.50},
        {"name": "Large", "price": 1.00}
      ]
    }
  ]
}
```

---

## Orders API

### Create Order
```http
POST /api/v1/orders
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "shop_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "base_price": 4.50,
      "customizations": [
        {"template_id": "uuid", "option": "Large", "price": 1.00}
      ]
    }
  ],
  "scheduled_for": "2026-02-04T14:30:00Z" // optional
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "order_number": "ORD-20260203-1234",
    "shop_id": "uuid",
    "customer_id": "uuid",
    "status": "pending",
    "subtotal": 9.00,
    "tax": 0.90,
    "total": 9.90,
    "loyalty_points_earned": 99,
    "is_scheduled": false,
    "scheduled_for": null,
    "items": [...],
    "created_at": "2026-02-03T20:00:00Z"
  }
}
```

### Get Order by ID
```http
GET /api/v1/orders/{order_id}
Authorization: Bearer YOUR_TOKEN
```

### List Customer Orders
```http
GET /api/v1/orders/my-orders?status=completed&limit=20&offset=0
Authorization: Bearer YOUR_TOKEN
```

### Cancel Order
```http
POST /api/v1/orders/{order_id}/cancel
Authorization: Bearer YOUR_TOKEN
```

### Update Order Status (Worker only)
```http
PATCH /api/v1/shops/{shop_id}/orders/{order_id}/status
Authorization: Bearer WORKER_TOKEN
```

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid Status Transitions:**
- `pending` → `accepted` or `cancelled`
- `accepted` → `preparing` or `cancelled`
- `preparing` → `ready` or `cancelled`
- `ready` → `completed`

### Get Shop Order Queue (Worker only)
```http
GET /api/v1/shops/{shop_id}/orders/queue?status=pending,accepted,preparing
Authorization: Bearer WORKER_TOKEN
```

### Export Orders (Owner only)
```http
GET /api/v1/shops/{shop_id}/orders/export?format=csv&start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer OWNER_TOKEN
```

**Query Parameters:**
- `format` - `csv` or `pdf`
- `start_date` (optional) - ISO date
- `end_date` (optional) - ISO date

**Response:** CSV or PDF file download

---

## Loyalty API

### Get Loyalty Balances
```http
GET /api/v1/loyalty/balances
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "balances": [
    {
      "shop_id": "uuid",
      "shop_name": "Java Junction",
      "points": 450,
      "updated_at": "2026-02-03T20:00:00Z"
    }
  ]
}
```

### Get Shop Rewards
```http
GET /api/v1/loyalty/shops/{shop_id}/rewards
```

**Response:**
```json
{
  "rewards": [
    {
      "id": "uuid",
      "shop_id": "uuid",
      "name": "Free Coffee",
      "description": "Any size, any style",
      "points_required": 100,
      "image_url": "https://...",
      "is_active": true
    }
  ]
}
```

### Redeem Reward
```http
POST /api/v1/loyalty/redeem
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "reward_id": "uuid",
  "shop_id": "uuid"
}
```

### Get Loyalty Transactions
```http
GET /api/v1/loyalty/transactions?shop_id=uuid&limit=50
Authorization: Bearer YOUR_TOKEN
```

---

## Admin API

### List All Users (Admin only)
```http
GET /api/v1/admin/users?role=customer&limit=50&offset=0
Authorization: Bearer ADMIN_TOKEN
```

### Update User Role (Admin only)
```http
PATCH /api/v1/admin/users/{user_id}/role
Authorization: Bearer ADMIN_TOKEN
```

**Request Body:**
```json
{
  "role": "shop_owner"
}
```

### Approve Shop (Admin only)
```http
POST /api/v1/admin/shops/{shop_id}/approve
Authorization: Bearer ADMIN_TOKEN
```

### Reject Shop (Admin only)
```http
POST /api/v1/admin/shops/{shop_id}/reject
Authorization: Bearer ADMIN_TOKEN
```

### Feature Shop (Admin only)
```http
POST /api/v1/admin/shops/{shop_id}/feature
Authorization: Bearer ADMIN_TOKEN
```

### Get Audit Logs (Admin only)
```http
GET /api/v1/admin/audit-logs?action=shop_approved&limit=100
Authorization: Bearer ADMIN_TOKEN
```

### Get Platform Analytics (Admin only)
```http
GET /api/v1/admin/analytics
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "total_users": 5234,
  "total_shops": 156,
  "total_orders": 45678,
  "total_revenue": 456789.12,
  "orders_today": 234,
  "revenue_today": 2345.67,
  "active_shops": 142,
  "pending_shops": 8
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "detail": "Additional context (optional)"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity (validation error) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Common Errors

**Authentication Failed**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Insufficient Permissions**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

**Resource Not Found**
```json
{
  "error": "Not Found",
  "message": "Shop not found"
}
```

**Validation Error**
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "detail": {
    "email": ["Invalid email format"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

## Rate Limiting

### Limits
- **Default:** 100 requests per 60 seconds per IP
- **Authenticated:** 200 requests per 60 seconds per user

### Headers
Rate limit information is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1675123456
```

### Rate Limit Exceeded Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 45
}
```

---

## Pagination

### Standard Pagination
Most list endpoints support pagination:
```http
GET /api/v1/endpoint?limit=20&offset=0
```

### Response Format
```json
{
  "items": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Interactive API Documentation

**Swagger UI:** `https://api.loyalcup.com/api/docs`  
**ReDoc:** `https://api.loyalcup.com/api/redoc`  
**OpenAPI Spec:** `https://api.loyalcup.com/api/openapi.json`

---

## SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// API calls with auth
const { data: shops } = await supabase
  .from('shops')
  .select('*')
  .eq('status', 'active')
```

### Python
```bash
pip install supabase
```

```python
from supabase import create_client

supabase = create_client(
    "https://your-project.supabase.co",
    "your-anon-key"
)

# Authentication
auth_response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "password"
})

# API calls
shops = supabase.table('shops') \\
    .select('*') \\
    .eq('status', 'active') \\
    .execute()
```

---

## Webhooks

### Shop Status Change
When a shop's status changes, a webhook is triggered:
```json
{
  "event": "shop.status_changed",
  "shop_id": "uuid",
  "old_status": "pending",
  "new_status": "active",
  "timestamp": "2026-02-03T20:00:00Z"
}
```

### Order Status Update
```json
{
  "event": "order.status_changed",
  "order_id": "uuid",
  "shop_id": "uuid",
  "customer_id": "uuid",
  "old_status": "preparing",
  "new_status": "ready",
  "timestamp": "2026-02-03T20:00:00Z"
}
```

---

## Support

For API support:
- **Documentation:** https://docs.loyalcup.com
- **Status Page:** https://status.loyalcup.com
- **Email:** api@loyalcup.com
- **GitHub Issues:** https://github.com/djgolla/LoyalCup/issues

---

**Last Updated:** 2026-02-03  
**API Version:** 1.0.0
