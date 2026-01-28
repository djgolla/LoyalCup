# Shop Owner Application Flow - Visual Guide

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOME PAGE (/)                                  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    HERO SECTION                                 │   │
│  │  "DISCOVER LOCAL • STAY LOYAL"                                  │   │
│  │                                                                  │   │
│  │  [Order Now]  [List Your Shop] ← CTA Button                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              FOR SHOP OWNERS SECTION                            │   │
│  │  "Grow Your Business with LoyalCup"                             │   │
│  │  • Reach More Customers                                         │   │
│  │  • Easy Menu Management                                         │   │
│  │  • Built-in Loyalty Program                                     │   │
│  │                                                                  │   │
│  │                    [Apply Now] ← CTA Button                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Click "List Your Shop"
                                    ↓
                        ┌───────────────────────┐
                        │  Check Authentication  │
                        └───────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
         Not Logged In                           Logged In
                │                                       │
                ↓                                       ↓
    ┌──────────────────────────┐          ┌──────────────────────────┐
    │   LOGIN PAGE (/login)    │          │  SHOP APPLICATION FORM   │
    │  with ?redirect param    │          │  (/shop-application)     │
    └──────────────────────────┘          └──────────────────────────┘
                │                                       │
                │ Login Success                         │
                │                                       │
                └───────────────┬───────────────────────┘
                                │
                                ↓
                ┌──────────────────────────────────────────┐
                │      SHOP APPLICATION FORM                │
                │  (/shop-application) - PROTECTED          │
                │                                           │
                │  Fields:                                  │
                │  • Business Name *                        │
                │  • Description                            │
                │  • Address *                              │
                │  • City *, State *, Zip *                 │
                │  • Phone *                                │
                │  • Business License                       │
                │  • Website                                │
                │  • Why Join?                              │
                │  • Terms Checkbox *                       │
                │                                           │
                │         [Submit Application]              │
                └──────────────────────────────────────────┘
                                │
                                │ Submit
                                ↓
                ┌──────────────────────────────────────────┐
                │   BACKEND: POST /api/v1/shops/apply      │
                │                                           │
                │  1. Authenticate user (JWT token)         │
                │  2. Check if user already owns shop       │
                │  3. Create shop (status='active')         │
                │  4. Update user role to 'shop_owner'      │
                │  5. Return shop data                      │
                └──────────────────────────────────────────┘
                                │
                                │ Success
                                ↓
                ┌──────────────────────────────────────────┐
                │   SUCCESS ACTIONS                         │
                │                                           │
                │  • Update auth metadata (role)            │
                │  • Show toast: "Welcome to LoyalCup!"     │
                │  • Redirect to /shop-owner                │
                └──────────────────────────────────────────┘
                                │
                                ↓
                ┌──────────────────────────────────────────┐
                │   SHOP OWNER DASHBOARD                    │
                │   (/shop-owner)                           │
                │                                           │
                │  Sidebar Menu:                            │
                │  • Dashboard                              │
                │  • Menu Builder                           │
                │  • Categories                             │
                │  • Customizations                         │
                │  • Orders                                 │
                │  • Analytics                              │
                │  • Loyalty                                │
                │  • Workers                                │
                │  • Shop Settings                          │
                │  • Profile ← NEW!                         │
                └──────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Home.jsx                                                        │
│  ├── useAuth() ← AuthContext                                    │
│  └── handleShopApplication()                                    │
│       ├── if authenticated → navigate('/shop-application')      │
│       └── else → navigate('/login?redirect=/shop-application')  │
│                                                                  │
│  CustomerLogin.jsx                                              │
│  ├── login() ← AuthContext                                      │
│  └── Check redirect param → navigate(redirect)                  │
│                                                                  │
│  ShopApplication.jsx (Protected Route)                          │
│  ├── Get JWT token from Supabase session                        │
│  ├── POST to /api/v1/shops/apply                                │
│  ├── Update auth metadata                                       │
│  └── Navigate to /shop-owner                                    │
│                                                                  │
│  ShopOwnerSidebar.jsx                                           │
│  └── Links: [Dashboard, Menu, ..., Shop Settings, Profile]     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST /api/v1/shops/apply
                              │ Authorization: Bearer <token>
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  shops.py (Routes)                                              │
│  └── @router.post("/apply")                                     │
│       ├── Depends(require_auth()) → Validates JWT               │
│       ├── Extract user_id from token                            │
│       └── Call shop_service.create_shop_application()           │
│                                                                  │
│  shop_service.py (Business Logic)                               │
│  └── create_shop_application()                                  │
│       ├── Query: Check existing shop for user                   │
│       ├── Insert: Create shop (status='active')                 │
│       ├── Update: Set profile.role = 'shop_owner'               │
│       └── Return: Shop data + success message                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer (Supabase)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  shops table                                                     │
│  ├── id (uuid, PK)                                              │
│  ├── owner_id (uuid, FK → profiles.id)                          │
│  ├── name, description, address, city, state, zip, phone        │
│  ├── status ('active')                                          │
│  └── created_at                                                 │
│                                                                  │
│  profiles table                                                  │
│  ├── id (uuid, PK, FK → auth.users)                            │
│  ├── role ('customer' → 'shop_owner')                          │
│  └── ... other profile fields                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                          │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS "LIST YOUR SHOP"
   └── Home.jsx checks useAuth().isAuthenticated

2. IF NOT AUTHENTICATED
   └── Redirect to /login?redirect=/shop-application
       └── CustomerLogin.jsx
           ├── User enters credentials
           ├── Calls AuthContext.login()
           ├── Supabase Auth validates
           └── On success, checks redirect param
               └── Navigates to /shop-application

3. IF AUTHENTICATED
   └── Navigate directly to /shop-application
       └── ProtectedRoute checks authentication
           ├── If not auth → redirect to /login
           └── If auth → render ShopApplication.jsx

4. FORM SUBMISSION
   └── ShopApplication.jsx
       ├── Get session token from Supabase
       ├── POST to /api/v1/shops/apply with token
       └── Backend validates token with JWT secret

5. BACKEND AUTHORIZATION
   └── shops.py
       ├── require_auth() dependency
       ├── Verifies JWT signature
       ├── Extracts user_id from token
       └── Proceeds with shop creation

6. ROLE UPDATE
   └── Database: profiles.role = 'shop_owner'
   └── Frontend: Update auth metadata
   └── Future logins: Auto-route to /shop-owner

7. ACCESS CONTROL
   └── RoleGuard component on /shop-owner/* routes
       ├── Checks user.user_metadata.role
       └── Only allows 'shop_owner' or 'admin'
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                             │
└─────────────────────────────────────────────────────────────────┘

ERROR: Not Authenticated
├── Trigger: Access /shop-application without login
├── Handler: ProtectedRoute component
└── Action: Redirect to /login with state.from

ERROR: Missing Required Fields
├── Trigger: Submit form with empty required fields
├── Handler: Browser HTML5 validation
└── Action: Show inline error, prevent submit

ERROR: Invalid Token
├── Trigger: Expired or malformed JWT token
├── Handler: Backend require_auth() dependency
├── Response: 401 Unauthorized
└── Action: Frontend shows error toast

ERROR: User Already Owns Shop
├── Trigger: Existing shop owner applies again
├── Handler: shop_service.create_shop_application()
├── Response: 400 Bad Request "User already owns a shop"
└── Action: Frontend shows error toast

ERROR: Database Error
├── Trigger: Database connection issue
├── Handler: try/except in shop_service
├── Response: 500 Internal Server Error
└── Action: Frontend shows generic error toast

ERROR: Network Error
├── Trigger: API request fails
├── Handler: try/catch in ShopApplication.jsx
└── Action: Show "Failed to submit application" toast
```

## Security Measures

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Features                            │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ✓ JWT token required for all shop operations
   ✓ Token validated against Supabase JWT secret
   ✓ Token includes user_id (sub claim)

2. AUTHORIZATION
   ✓ Role-based access control (RBAC)
   ✓ Only authenticated users can apply
   ✓ Only shop_owners can access dashboard
   ✓ RoleGuard component protects routes

3. INPUT VALIDATION
   ✓ Frontend: HTML5 form validation
   ✓ Frontend: Required field checks
   ✓ Backend: Pydantic model validation
   ✓ Backend: SQL injection prevention (Supabase)

4. DUPLICATE PREVENTION
   ✓ Backend checks for existing shop ownership
   ✓ Prevents multiple shop creation per user
   ✓ Returns 400 error if shop exists

5. PROTECTED ROUTES
   ✓ /shop-application requires authentication
   ✓ /shop-owner/* requires shop_owner role
   ✓ Automatic redirect for unauthorized access

6. SESSION MANAGEMENT
   ✓ Supabase handles session expiration
   ✓ Frontend checks session before API calls
   ✓ Tokens expire after configured time

7. CODE SECURITY
   ✓ CodeQL scan: 0 vulnerabilities
   ✓ No SQL injection risks
   ✓ No XSS vulnerabilities
   ✓ No sensitive data exposure
```

## File Changes Summary

```
Backend Files Modified:
  • backend/app/routes/shops.py
    - Added ShopApplicationRequest model
    - Added POST /apply endpoint
    - Added require_auth dependency

  • backend/app/services/shop_service.py
    - Added create_shop_application() method
    - Validates duplicate shop ownership
    - Creates shop and updates role

Frontend Files Modified:
  • web/src/pages/customer/Home.jsx
    - Added useAuth hook
    - Added handleShopApplication()
    - Updated both CTA buttons

  • web/src/pages/auth/CustomerLogin.jsx
    - Added redirect query param handling
    - Routes to redirect after login

  • web/src/pages/auth/ShopApplication.jsx
    - Changed to use /api/v1/shops/apply
    - Added zip field to submission
    - Redirects to /shop-owner on success
    - Updates auth metadata

  • web/src/components/navigation/ShopOwnerSidebar.jsx
    - Added Profile link
    - Renamed Settings to Shop Settings

  • web/src/App.jsx
    - Protected /shop-application route
    - Uses ProtectedRoute component

Documentation Added:
  • SHOP_OWNER_APPLICATION_FLOW.md
    - Complete implementation guide
    - API documentation
    - Testing checklist

  • SHOP_OWNER_VISUAL_GUIDE.md
    - Flow diagrams
    - Component interactions
    - Security measures
```
