# LoyalCup Super Admin Dashboard

## Quick Start

### Accessing the Admin Dashboard

The admin dashboard is intentionally hidden from regular users for security.

**Login URL**: `/admin/login`

**Demo Credentials**:
- Email: `admin@loyalcup.com`
- Password: `admin`

## Features Overview

### 1. Dashboard (`/admin`)
Main platform overview with real-time metrics:
- Revenue tracking with trend indicators
- Order volume statistics
- User growth metrics
- Active shops count
- Revenue chart (30-day trend)
- Pending actions widget (shops to approve, reports to review)
- Top performing shops leaderboard
- Recent activity feed

### 2. Shop Management (`/admin/shops`)
Complete control over all coffee shops:
- **List View**: See all shops with status badges
- **Filters**: Active, Pending, Suspended, Featured
- **Search**: Find shops by name or owner email
- **Actions**:
  - Approve pending shops
  - Suspend problematic shops
  - Toggle featured status (adds star badge)
  - Delete shops permanently
- **Status Indicators**:
  - 🟢 Active (approved and operating)
  - 🟡 Pending (awaiting approval)
  - 🔴 Suspended (temporarily disabled)

### 3. User Management (`/admin/users`)
Manage all platform users:
- **List View**: All users with role and status
- **Filters**: Customer, Shop Worker, Shop Owner, Admin
- **Search**: Find by name or email
- **Role Management**: Upgrade/downgrade user roles
  - Customer → Worker → Owner → Admin
- **Actions**:
  - Change user role
  - Suspend/activate accounts
  - Delete users
- **Role Badges**:
  - Purple: Admin
  - Blue: Shop Owner
  - Cyan: Shop Worker
  - Gray: Customer

### 4. Analytics (`/admin/analytics`)
Deep dive into platform metrics:
- **Period Selection**: Week, Month, Quarter, Year
- **Charts**:
  - Orders trend (bar chart)
  - Revenue trend (line chart)
  - User growth (line chart)
- **Key Metrics**:
  - Total orders with % change
  - Total revenue with % change
  - Average order value

### 5. Platform Settings (`/admin/settings`)
Configure platform-wide settings:
- **General**:
  - Platform name
  - Maintenance mode toggle
- **Loyalty Program**:
  - Enable/disable global loyalty
  - Points per dollar spent
- **Shop Settings**:
  - Require admin approval for new shops
  - Maximum shops per owner

### 6. Audit Log (`/admin/audit-log`)
View history of all admin actions:
- **Filterable**: By entity type (shops, users, settings)
- **Details**: Timestamp, admin, action, IP address
- **Color Coded**:
  - Red: Deletions
  - Yellow: Suspensions
  - Green: Approvals/Activations
  - Blue: Other actions

## Security Features

### Authentication
- Separate admin login (not shared with regular users)
- Role-based access (must have admin role)
- All admin endpoints protected by authentication middleware

### Audit Trail
- Every admin action is logged to database
- Includes: who, what, when, where (IP)
- Cannot be modified or deleted
- Viewable in Audit Log page

### Hidden Access
- Admin routes not linked in main UI
- Requires direct URL navigation
- Dark theme differentiates from user interface

## API Endpoints

All endpoints require admin authentication.

### Dashboard
```
GET /api/v1/admin/dashboard
```

### Shop Management
```
GET    /api/v1/admin/shops
GET    /api/v1/admin/shops/{id}
PUT    /api/v1/admin/shops/{id}/status
PUT    /api/v1/admin/shops/{id}/featured
DELETE /api/v1/admin/shops/{id}
```

### User Management
```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{id}
PUT    /api/v1/admin/users/{id}/role
PUT    /api/v1/admin/users/{id}/status
DELETE /api/v1/admin/users/{id}
```

### Analytics
```
GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/orders
GET /api/v1/admin/analytics/revenue
GET /api/v1/admin/analytics/growth
```

### Settings
```
GET /api/v1/admin/settings
PUT /api/v1/admin/settings
```

### Audit Log
```
GET /api/v1/admin/audit-log
```

## Database Schema

### New Tables

**audit_log**
```sql
id          uuid PRIMARY KEY
admin_id    uuid REFERENCES profiles(id)
action      text NOT NULL
entity_type text
entity_id   uuid
details     jsonb
ip_address  text
created_at  timestamptz
```

### Modified Tables

**shops**
- Added `status` (pending | active | suspended)
- Added `featured` (boolean)

**profiles**
- Added `status` (active | suspended)

## Common Tasks

### Approving a New Shop
1. Navigate to `/admin/shops`
2. Click "Pending" filter
3. Click ••• menu on shop row
4. Select "Approve Shop"
5. Shop status changes to Active

### Promoting a User to Shop Owner
1. Navigate to `/admin/users`
2. Search for user
3. Click ••• menu on user row
4. Select role → "shop owner"
5. User can now create/manage shops

### Suspending a Problematic Account
1. Find user in `/admin/users`
2. Click ••• menu
3. Select "Suspend User"
4. User cannot log in until reactivated

### Making a Shop Featured
1. Navigate to `/admin/shops`
2. Find shop to feature
3. Click ••• menu
4. Select "Make Featured"
5. Star ⭐ appears next to shop name

### Enabling Maintenance Mode
1. Go to `/admin/settings`
2. Toggle "Maintenance Mode" switch
3. Click "Save Changes"
4. Platform shows maintenance page to users

## Design Philosophy

- **Dark Theme**: Reduces eye strain for long admin sessions
- **Data Dense**: Maximum information in minimal space
- **Quick Actions**: Common tasks accessible in 2 clicks
- **Visual Hierarchy**: Important info stands out
- **Responsive**: Works on desktop, tablet, mobile
- **Professional**: Serious, trustworthy aesthetic

## Future Enhancements

Planned features:
- Two-factor authentication (2FA)
- Real-time notifications
- Data export (CSV, PDF)
- Batch operations
- Advanced filtering
- User impersonation for debugging
- Email templates management
- Automated fraud detection
- Revenue forecasting
- Cohort analysis

## Troubleshooting

**Cannot access `/admin`**
- Make sure you're logged in with admin role
- Try logging in at `/admin/login` first

**Charts not showing**
- Check browser console for errors
- Ensure mock data is loading (dev mode only)

**Changes not saving**
- Check network tab for failed requests
- Verify admin authentication is valid

## Support

For admin dashboard issues:
- Check audit log for action history
- Review browser console for errors
- Contact platform developers

## Notes

- This is a **GOD-MODE** dashboard with full platform control
- All actions are logged and auditable
- Use responsibly - changes affect all users
- Test in staging before production changes
