# Shop Owner Application Flow - Implementation Documentation

## Overview
This document describes the implementation of the streamlined shop owner application flow in LoyalCup.

## User Flow

### 1. Discovery (Home Page)
- **Location**: `web/src/pages/customer/Home.jsx`
- **Features**:
  - Two prominent "List Your Shop" CTAs (one in hero, one in shop owner section)
  - CTAs check authentication status before navigation
  - Not logged in → redirects to `/login?redirect=/shop-application`
  - Logged in → navigates directly to `/shop-application`

### 2. Authentication (Login Page)
- **Location**: `web/src/pages/auth/CustomerLogin.jsx`
- **Features**:
  - Handles redirect query parameter
  - After successful login, checks for `?redirect=` parameter
  - Redirects to specified path (e.g., `/shop-application`)
  - Role-based routing for existing shop owners/admins

### 3. Application Form
- **Location**: `web/src/pages/auth/ShopApplication.jsx`
- **Route**: `/shop-application` (protected - requires authentication)
- **Form Fields**:
  - Business Name* (required)
  - Description (optional)
  - Business Address* (required)
  - City* (required)
  - State* (required)
  - Zip Code* (required)
  - Phone Number* (required)
  - Business License Number (optional)
  - Website (optional, URL validation)
  - Why do you want to join LoyalCup? (optional)
  - Terms & Conditions checkbox* (required)

### 4. Backend Processing
- **Endpoint**: `POST /api/v1/shops/apply`
- **Location**: `backend/app/routes/shops.py`
- **Process**:
  1. Authenticates user via JWT token
  2. Validates user doesn't already own a shop
  3. Creates shop record with `status='active'`
  4. Updates user profile role to `'shop_owner'`
  5. Returns shop data and success message

### 5. Success & Redirect
- **Actions**:
  1. Updates Supabase auth user metadata with new role
  2. Shows success toast: "Application approved! Welcome to LoyalCup."
  3. Redirects to `/shop-owner` dashboard
  4. Future logins automatically route to shop owner dashboard

## Technical Implementation

### Backend Changes

#### 1. New Pydantic Model (`backend/app/routes/shops.py`)
```python
class ShopApplicationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    zip: str
    phone: str
    business_license: Optional[str] = None
    website: Optional[str] = None
    why_join: Optional[str] = None
```

#### 2. New API Endpoint (`backend/app/routes/shops.py`)
```python
@router.post("/apply")
async def apply_shop_owner(
    application: ShopApplicationRequest,
    token_payload: dict = Depends(require_auth())
):
    """
    Apply to become a shop owner and create a new shop.
    Automatically upgrades user role to 'shop_owner' and creates shop with active status.
    """
```

#### 3. New Service Method (`backend/app/services/shop_service.py`)
```python
async def create_shop_application(self, user_id: str, application_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a shop application and upgrade user to shop_owner.
    Validates that user doesn't already own a shop.
    """
```

**Key Features**:
- Validates user doesn't already own a shop
- Creates shop with `status='active'` (no approval needed)
- Updates profile role to `'shop_owner'`
- Returns shop data and success message
- Handles errors appropriately

### Frontend Changes

#### 1. Updated Home Page (`web/src/pages/customer/Home.jsx`)
- Added `useAuth` hook to check authentication
- Created `handleShopApplication()` function:
  - Checks if user is authenticated
  - Routes to `/shop-application` if logged in
  - Routes to `/login?redirect=/shop-application` if not logged in
- Updated both CTA buttons to use the handler

#### 2. Updated Login Page (`web/src/pages/auth/CustomerLogin.jsx`)
- Added query parameter parsing for redirect
- After successful login:
  - Checks for `redirect` query parameter
  - Routes to redirect path if present
  - Falls back to role-based routing or home page

#### 3. Updated Application Form (`web/src/pages/auth/ShopApplication.jsx`)
- Changed to use new `/api/v1/shops/apply` endpoint
- Includes all required fields including `zip`
- Sends JWT token in Authorization header
- Updates Supabase auth metadata on success
- Redirects to `/shop-owner` (not `/application-pending`)
- Shows proper success message

#### 4. Updated Shop Owner Sidebar (`web/src/components/navigation/ShopOwnerSidebar.jsx`)
- Added `UserCircle` icon import
- Added new "Profile" link to `/profile`
- Renamed "Settings" to "Shop Settings" for clarity
- Shop owners can now access both personal and shop settings

#### 5. Updated App Routes (`web/src/App.jsx`)
- Moved `/shop-application` to protected route
- Requires authentication to access
- Uses `ProtectedRoute` component

## Security Features

1. **Authentication Required**: All shop application operations require valid JWT token
2. **Duplicate Prevention**: Backend validates user doesn't already own a shop
3. **Role-Based Access**: Shop owner routes protected by `RoleGuard`
4. **Input Validation**: Form fields validated on client and server
5. **SQL Injection Prevention**: Using Supabase client with parameterized queries

## Database Schema

### shops Table
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ...
);
```

### profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'customer',
  ...
);
```

**Valid roles**: `customer`, `shop_owner`, `shop_worker`, `admin`

## Testing Checklist

### Manual Testing Steps

1. **Home Page CTA (Not Logged In)**
   - [ ] Visit home page as guest
   - [ ] Click "List Your Shop" button
   - [ ] Verify redirect to `/login?redirect=/shop-application`

2. **Home Page CTA (Logged In)**
   - [ ] Login as customer
   - [ ] Visit home page
   - [ ] Click "List Your Shop" button
   - [ ] Verify navigation to `/shop-application` form

3. **Application Form Validation**
   - [ ] Try submitting with missing required fields
   - [ ] Verify error messages display
   - [ ] Try submitting with invalid URL in website field
   - [ ] Verify URL validation works

4. **Application Submission**
   - [ ] Fill out complete form
   - [ ] Submit application
   - [ ] Verify loading state shows
   - [ ] Verify success message displays
   - [ ] Verify redirect to `/shop-owner` dashboard

5. **Shop Owner Dashboard**
   - [ ] Verify shop owner dashboard loads
   - [ ] Verify sidebar shows "Profile" and "Shop Settings"
   - [ ] Click "Profile" and verify navigation to profile page
   - [ ] Click "Shop Settings" and verify navigation works

6. **Role-Based Routing**
   - [ ] Logout and login again as shop owner
   - [ ] Verify automatic redirect to `/shop-owner` dashboard
   - [ ] Verify can't access shop application form again

7. **Duplicate Prevention**
   - [ ] Try to access `/shop-application` as shop owner
   - [ ] Submit application
   - [ ] Verify error: "User already owns a shop"

## API Documentation

### POST /api/v1/shops/apply

**Description**: Apply to become a shop owner and create a new shop.

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "name": "The Coffee Corner",
  "description": "Cozy neighborhood coffee shop",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94102",
  "phone": "(555) 123-4567",
  "business_license": "BL-12345",
  "website": "https://coffeecorner.com",
  "why_join": "Want to reach more customers and use loyalty features"
}
```

**Response (200 OK)**:
```json
{
  "shop": {
    "id": "uuid",
    "name": "The Coffee Corner",
    "description": "Cozy neighborhood coffee shop",
    "address": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "phone": "(555) 123-4567",
    "owner_id": "user-uuid",
    "status": "active",
    "created_at": "2024-01-28T19:00:00Z"
  },
  "message": "Shop application approved! Welcome to LoyalCup."
}
```

**Error Responses**:
- `400 Bad Request`: "User already owns a shop"
- `401 Unauthorized`: "Invalid authentication credentials"
- `500 Internal Server Error`: "Failed to create shop application"

## Success Criteria ✅

- [x] Clear path from "I'm a customer" to "I'm a shop owner"
- [x] No confusing navigation or dead ends
- [x] Shop owners automatically land on their dashboard
- [x] Application process feels smooth and professional
- [x] Shop owner can access profile/settings
- [x] Protected routes prevent unauthorized access
- [x] Duplicate shop prevention
- [x] Proper error handling and user feedback

## Future Enhancements

1. **Email Notifications**: Send welcome email to new shop owners
2. **Onboarding Tour**: Add guided tour of shop owner dashboard
3. **Application Status**: Track application history
4. **Multi-Shop Support**: Allow users to own multiple shops
5. **Application Review**: Add optional admin approval process
6. **Analytics**: Track application conversion rates
