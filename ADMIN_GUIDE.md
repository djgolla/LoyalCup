# LoyalCup Admin Guide

**Welcome to the LoyalCup Administration Panel!** This guide covers platform management, oversight, and administration.

---

## Table of Contents

1. [Admin Overview](#admin-overview)
2. [Admin Dashboard](#admin-dashboard)
3. [Shop Management](#shop-management)
4. [User Management](#user-management)
5. [Platform Analytics](#platform-analytics)
6. [Platform Configuration](#platform-configuration)
7. [Audit Logs](#audit-logs)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting & Maintenance](#troubleshooting--maintenance)
10. [Emergency Procedures](#emergency-procedures)

---

## Admin Overview

### What is the Admin Role?

As a **LoyalCup Administrator**, you have oversight and management capabilities for the entire platform. Your responsibilities include:

- 🏪 **Shop Oversight** - Reviewing applications, approving/suspending shops, featuring shops
- 👥 **User Management** - Managing user accounts, roles, and permissions
- 📊 **Platform Analytics** - Monitoring platform health, revenue, growth metrics
- ⚙️ **Configuration** - Setting platform-wide settings and policies
- 🔍 **Audit & Compliance** - Reviewing system activity logs and ensuring compliance
- 🛡️ **Security** - Maintaining platform security and responding to incidents
- 🚨 **Issue Resolution** - Handling escalated support tickets and disputes

### Admin Account Security

**⚠️ CRITICAL:** Your admin account has elevated privileges. Follow these security practices:

✅ **Use a strong, unique password** (20+ characters, mixed case, numbers, symbols)  
✅ **Enable two-factor authentication (2FA)** - REQUIRED for all admins  
✅ **Never share credentials** with anyone  
✅ **Log out when not actively using admin panel**  
✅ **Access only from secure networks** (avoid public WiFi)  
✅ **Use a dedicated browser profile** for admin work  
✅ **Keep your devices secure** (encrypted, password-protected, updated)  
✅ **Review your login activity** regularly  

> **🔒 Security Note:** All admin actions are logged and auditable. Use your powers responsibly!

---

## Admin Dashboard

### Accessing the Admin Panel

**URL:** loyalcup.com/admin-login

**Login Steps:**
1. Navigate to admin login page
2. Enter admin email and password
3. Complete 2FA verification (authenticator app code)
4. Access granted to admin dashboard

**[Screenshot placeholder: Admin login page with 2FA]**

### Dashboard Layout

The admin dashboard provides a high-level overview of platform health and activity.

**[Screenshot placeholder: Admin dashboard overview]**

### Dashboard Sections

#### Top KPI Cards

**Platform Overview:**
- 💰 **Total Revenue** - All-time and current month
- 📦 **Orders Today/This Month** - Order volume with trend
- 👥 **Total Users** - Customer count with growth rate
- 🏪 **Active Shops** - Approved and operational shops
- ⏳ **Pending Actions** - Shop applications and flagged content

**[Screenshot placeholder: KPI cards]**

#### Revenue Trends Chart

**Visual representation of:**
- Daily revenue (last 30 days)
- Monthly revenue (last 12 months)
- Year-over-year comparison
- Trend line with forecasting

**Interactive features:**
- Hover for exact amounts
- Click to drill down into specific dates
- Export data as CSV

**[Screenshot placeholder: Revenue trends chart]**

#### Order Analytics

**Status Breakdown:**
- Pending orders (pie chart)
- Completed orders (bar chart)
- Cancelled orders with reasons
- Average order value

#### Top Performing Shops

**Leaderboard showing:**
- Shop name and location
- Total orders this month
- Total revenue this month
- Growth percentage
- Quick actions (view details, feature, suspend)

**Sort by:**
- Revenue (highest to lowest)
- Order count
- Customer reviews
- Growth rate

**[Screenshot placeholder: Top shops list]**

#### Recent Activity Feed

**Live stream of platform activity:**
- 🆕 New user registrations
- 🏪 Shop applications submitted
- 📦 High-value orders ($50+)
- ⚠️ Flagged content or issues
- 🎉 Milestones (1000th order, etc.)

**Filters:**
- Activity type
- Time range
- Severity (info, warning, critical)

#### Pending Actions

**Action Items Requiring Attention:**
- 📝 **Shop Applications** - [Count] pending review
- 🚨 **Flagged Orders** - [Count] require investigation
- 📧 **Support Tickets** - [Count] escalated to admin
- ⚠️ **System Alerts** - [Count] require action

**Click to navigate to relevant management page**

---

## Shop Management

Shop management is one of your primary responsibilities. This includes reviewing applications, approving shops, and ongoing oversight.

### Accessing Shop Management

**Dashboard → Shops** (or **Shop Management** in navigation)

**[Screenshot placeholder: Shop management interface]**

### Shop Application Review

#### Viewing Applications

**Navigate to:** Shops → Applications → Pending

**Application Queue shows:**
- Application date
- Business name and DBA
- Owner name and contact
- Location (city, state)
- Application status (new, under review, approved, rejected)

**[Screenshot placeholder: Application queue]**

#### Reviewing an Application

**Click any application to view details:**

**Business Information Section:**
- Legal business name
- DBA (Doing Business As)
- Business address
- Business phone and email
- Website
- Social media links

**Owner Information Section:**
- Full name
- Email address
- Phone number
- Background check status

**Documentation Section:**
- Business license (number and upload)
- Tax ID (EIN)
- Insurance policy (document)
- Food service permits
- Certificate of occupancy (if applicable)

**Shop Details Section:**
- Number of locations
- Years in business
- Average daily customers
- Current POS system
- Why they want to join LoyalCup (free text)

**[Screenshot placeholder: Application details view]**

#### Application Review Checklist

Before approving, verify:

☐ **Business License**
- Valid and current (not expired)
- Matches business name in application
- Issued for correct location

☐ **Tax ID (EIN)**
- Valid 9-digit EIN format (XX-XXXXXXX)
- Matches business name
- Verified with IRS (if policy requires)

☐ **Insurance**
- General liability insurance
- Current and active (not expired)
- Adequate coverage (minimum $1M recommended)

☐ **Business Type**
- Is actually a coffee shop or café
- Not a restaurant that happens to serve coffee
- Meets platform eligibility criteria

☐ **Location**
- Physical storefront (not home-based)
- In supported service area
- Not duplicate of existing shop

☐ **Owner Verification**
- Email is valid
- Phone number confirmed (test call if needed)
- Background check passed (if policy requires)

☐ **Business Health**
- Years in business (prefer 1+ years)
- Good standing with state/local authorities
- No major violations or complaints

#### Approving an Application

**If all checks pass:**

1. **Click "Approve Application"**
2. **Set initial shop status:**
   - ✅ Active (immediately live on platform)
   - 📝 Active - Pending Setup (approved but not visible until menu added)
3. **Configure commission rate** (default or custom)
4. **Add internal notes** (optional, for admin records)
5. **Click "Confirm Approval"**

**System actions:**
- ✉️ Approval email sent to shop owner
- 🔑 Shop owner account activated
- 🎯 Shop added to platform directory
- 📋 Onboarding checklist sent

**[Screenshot placeholder: Approve application modal]**

#### Rejecting an Application

**If application doesn't meet criteria:**

1. **Click "Reject Application"**
2. **Select rejection reason:**
   - Incomplete or inaccurate information
   - Invalid business license
   - Failed background check
   - Business type not eligible
   - Location not supported
   - Duplicate application
   - Other (requires explanation)
3. **Add detailed rejection notes** (sent to applicant)
4. **Choose reapplication eligibility:**
   - Can reapply after 30 days
   - Can reapply after 90 days
   - Permanently ineligible
5. **Click "Confirm Rejection"**

**System actions:**
- ✉️ Rejection email sent with reasons
- 🔒 Application marked as rejected
- 📝 Notes logged in audit trail

**[Screenshot placeholder: Reject application modal]**

> **💡 Best Practice:** Be specific in rejection notes. Help applicants understand what they need to fix to reapply successfully.

#### Requesting More Information

**If application is incomplete:**

1. **Click "Request More Information"**
2. **Select what's needed:**
   - Additional documentation
   - Clarification on specific details
   - Updated or corrected information
3. **Write specific request** (clear and actionable)
4. **Set deadline** for response (typically 7-14 days)
5. **Click "Send Request"**

**System actions:**
- ✉️ Email sent to applicant
- ⏰ Application marked as "Pending Information"
- 📅 Reminder sent 2 days before deadline

**Application returns to queue when applicant responds**

---

### Managing Active Shops

#### Shop Directory

**Navigate to:** Shops → All Shops

**View all shops with:**
- Shop name and logo
- Location
- Status (Active, Suspended, Inactive)
- Total orders
- Total revenue
- Join date
- Last activity
- Quick actions

**[Screenshot placeholder: Shop directory list]**

#### Filtering & Search

**Filter by:**
- Status (Active, Suspended, Pending Setup, Inactive)
- Location (city, state, region)
- Join date (newest, oldest)
- Performance (revenue, order count)
- Featured status

**Search by:**
- Shop name
- Owner name
- City
- Email

**Sort by:**
- Name (A-Z)
- Revenue (high to low)
- Orders (most to least)
- Join date (newest first)
- Last active (most recent)

#### Shop Details View

**Click any shop to view full details:**

**Overview Tab:**
- Shop profile information
- Owner details
- Status and activation date
- Performance metrics (orders, revenue, ratings)
- Current menu item count
- Active workers

**Orders Tab:**
- Recent orders
- Order trends (daily, weekly, monthly)
- Average order value
- Peak hours analysis
- Cancellation rate

**Analytics Tab:**
- Revenue over time
- Top-selling items
- Customer retention
- Loyalty program participation
- Growth metrics

**Settings Tab:**
- Commission rate
- Payout schedule
- Feature status
- Shop-specific configurations

**Activity Log Tab:**
- Login activity
- Menu changes
- Status changes
- Support tickets
- Admin actions taken

**[Screenshot placeholder: Shop details view]**

---

### Shop Actions

#### Featuring a Shop

**Feature shops to appear prominently on homepage and in searches.**

**To feature a shop:**
1. Open shop details
2. Click "Feature This Shop"
3. Select feature tier:
   - **Hero Feature** - Large banner on homepage (1 shop at a time)
   - **Featured Partner** - Featured section on homepage (up to 10 shops)
   - **Search Boost** - Appears higher in search results
4. Set duration:
   - 1 week
   - 1 month
   - 3 months
   - Indefinite (until manually removed)
5. Add feature note (internal, why featured)
6. Confirm

**Featured shops receive:**
- 🎯 Increased visibility
- 🔼 Higher search ranking
- ⭐ "Featured" badge on shop page
- 📈 Average 40% increase in orders

> **💡 Strategy:** Feature high-performing shops as examples, new shops to help them launch, or shops in underserved areas to boost coverage.

**[Screenshot placeholder: Feature shop interface]**

#### Suspending a Shop

**Suspend shops for policy violations, quality issues, or legal concerns.**

**Reasons to suspend:**
- Repeated quality complaints
- Policy violations (fake reviews, inappropriate behavior)
- Legal/compliance issues
- Payment disputes
- Unresponsive to customer complaints
- Food safety concerns

**To suspend a shop:**
1. Open shop details
2. Click "Suspend Shop"
3. **Select reason:**
   - Quality complaints
   - Policy violation
   - Legal/compliance issue
   - Payment dispute
   - Other (explain)
4. **Add detailed notes** (internal and to shop owner)
5. **Choose suspension type:**
   - **Immediate** - Effective immediately, orders in queue cancelled
   - **After Current Orders** - Complete pending orders first
   - **Scheduled** - Suspend at specific date/time
6. **Set resolution actions** (what shop must do to be reinstated)
7. **Click "Confirm Suspension"**

**Effects of suspension:**
- 🚫 Shop hidden from customer searches
- ❌ Cannot accept new orders
- 🔒 Shop owner login disabled (optional)
- ✉️ Notification sent to shop owner with reasons and resolution steps

**[Screenshot placeholder: Suspend shop modal]**

#### Reinstating a Suspended Shop

**After issues are resolved:**

1. Open suspended shop details
2. Review suspension reason and resolution actions
3. Verify required actions completed
4. Click "Reinstate Shop"
5. Add reinstatement notes
6. Confirm

**Shop returns to active status, full access restored**

#### Deleting a Shop

**⚠️ CAUTION:** Deleting a shop is permanent and cannot be undone.

**Only delete for:**
- Duplicate accounts
- Test accounts
- Fraudulent accounts
- Shops that request permanent deletion
- Shops that have never been active

**To delete a shop:**
1. Open shop details
2. Scroll to bottom → "Danger Zone"
3. Click "Delete Shop"
4. **Type shop name to confirm** (prevents accidental deletion)
5. Select data retention:
   - Keep anonymized order data for analytics
   - Permanently delete all data (GDPR right to erasure)
6. Add deletion reason (required, for audit log)
7. Confirm deletion

**Effects:**
- 🗑️ Shop removed from platform
- 🔒 Owner account deactivated
- 📊 Historical data archived or deleted per selection
- 💰 Final payout processed (if balance exists)

> **🔒 Compliance:** Deletion logs are retained for 7 years for audit purposes, even if data is deleted.

---

## User Management

Manage all platform users: customers, shop owners, workers, and admins.

### Accessing User Management

**Dashboard → Users** (or **User Management** in navigation)

**[Screenshot placeholder: User management interface]**

### User Directory

**View all users with:**
- Name and avatar
- Email address
- Role (Customer, Shop Owner, Shop Worker, Admin)
- Status (Active, Suspended, Deleted)
- Join date
- Last login
- Total orders (customers) or shops managed (owners)
- Quick actions

**[Screenshot placeholder: User directory]**

### Filtering & Searching Users

**Filter by:**
- Role
- Status (Active, Suspended)
- Join date range
- Last active date
- Has made orders (Yes/No)
- Loyalty program participation

**Search by:**
- Name (first, last, or full)
- Email address
- Phone number
- User ID

**Sort by:**
- Name (A-Z)
- Join date (newest/oldest)
- Last active
- Total orders (customers)
- Total spent (customers)

---

### User Details View

**Click any user to view full profile:**

**Profile Tab:**
- Full name
- Email and phone
- Avatar/profile picture
- Role and permissions
- Account status
- Member since date
- Last login date
- Email verified status
- 2FA enabled status

**Activity Tab:**
- Login history (dates, IPs, devices)
- Orders placed (for customers)
- Shops managed (for owners)
- Admin actions taken (for admins)

**Orders Tab** (Customers):
- Complete order history
- Total orders and spend
- Favorite shops
- Loyalty points by shop
- Redeemed rewards

**Shops Tab** (Shop Owners/Workers):
- Associated shops
- Role at each shop (owner, worker, manager)
- Performance metrics

**Security Tab:**
- Password last changed
- 2FA status
- Active sessions
- Login history with locations
- Security events (failed logins, password resets)

**Notes Tab:**
- Admin notes (internal only)
- Support ticket history
- Escalated issues
- Compliance flags

**[Screenshot placeholder: User details view]**

---

### User Actions

#### Changing User Roles

**Assign or modify user roles:**

1. Open user details
2. Navigate to **Profile Tab**
3. Click **"Change Role"**
4. Select new role:
   - **Customer** - Can browse and order
   - **Shop Owner** - Can manage shops, menus, orders
   - **Shop Worker** - Can manage orders at assigned shops
   - **Admin** - Full platform access
5. If changing to Shop Owner:
   - Associate with existing shop, or
   - Mark as pending shop application
6. If changing to Shop Worker:
   - Select shop(s) to assign
   - Set worker permissions (view-only, can update orders, etc.)
7. Add reason for role change (audit log)
8. Click **"Confirm Role Change"**

**User is notified via email of role change**

**[Screenshot placeholder: Change user role modal]**

> **⚠️ Admin Role:** Use extreme caution when granting admin access. Requires approval from platform owner.

---

#### Suspending a User Account

**Suspend users for policy violations, abuse, or security concerns.**

**Reasons to suspend:**
- Terms of service violation
- Abusive behavior toward shops/workers
- Fraudulent activity or chargebacks
- Spam or fake reviews
- Multiple account violations
- Security concerns (compromised account)

**To suspend a user:**
1. Open user details
2. Click **"Suspend Account"**
3. Select reason:
   - Policy violation (specify which policy)
   - Abusive behavior
   - Fraud or payment issues
   - Security concern
   - Other (explain)
4. Set suspension duration:
   - 7 days (temporary)
   - 30 days (standard)
   - 90 days (extended)
   - Indefinite (permanent until manual review)
5. Add detailed notes (why suspended, evidence)
6. Choose if user should be notified
7. Click **"Confirm Suspension"**

**Effects:**
- 🚫 User cannot log in
- ❌ Active orders cancelled (with refund)
- ✉️ Suspension email sent (if notification enabled)
- 📝 Suspension logged in audit trail

**[Screenshot placeholder: Suspend user modal]**

---

#### Reactivating a Suspended User

**After suspension period ends or issues resolved:**

1. Open suspended user details
2. Click **"Reactivate Account"**
3. Review suspension reason and notes
4. Add reactivation notes (why reactivating)
5. Set reactivation conditions (optional):
   - Must change password
   - Must re-verify email
   - Probationary period (30 days)
6. Click **"Confirm Reactivation"**

**User can log in again, receives reactivation email**

---

#### Deleting a User Account

**⚠️ CAUTION:** User deletion is permanent for GDPR compliance.

**Valid reasons to delete:**
- User requested account deletion (GDPR right to erasure)
- Fraudulent account with no legitimate activity
- Test account
- Duplicate account

**To delete a user:**
1. Open user details
2. Scroll to **"Danger Zone"**
3. Click **"Delete User Account"**
4. Type user's email to confirm
5. Select data retention:
   - **Anonymize** - Keep order data with PII removed
   - **Full Deletion** - Remove all data (GDPR)
6. Add deletion reason (required)
7. Confirm deletion

**Effects:**
- 🗑️ Account permanently removed
- 📊 Orders anonymized or deleted per selection
- 💰 Unused loyalty points forfeited
- 🔒 Login disabled immediately

> **📋 GDPR Compliance:** Process deletion requests within 30 days. Log all deletions for audit.

---

#### Viewing User Login Activity

**Monitor for suspicious activity:**

1. Open user details
2. Navigate to **Security Tab**
3. View login history:
   - Date and time
   - IP address
   - Location (city, country)
   - Device and browser
   - Success/failure status

**Red flags to watch for:**
- Logins from multiple countries in short time
- Many failed login attempts
- Unusual login times for user's pattern
- New devices/browsers suddenly
- Login from known VPN/proxy services

**If suspicious activity detected:**
1. **Force logout all sessions**
2. **Require password reset**
3. **Enable additional security checks**
4. **Contact user** to verify legitimate activity
5. **Suspend if compromise confirmed**

**[Screenshot placeholder: Login activity log]**

---

## Platform Analytics

Monitor overall platform health, growth, and performance.

### Accessing Platform Analytics

**Dashboard → Analytics** (or **Reports** in navigation)

**[Screenshot placeholder: Platform analytics dashboard]**

### Revenue Analytics

**Navigate to:** Analytics → Revenue

**Key Metrics:**

**Total Platform Revenue:**
- All-time total
- Current month
- Current year
- Growth vs. previous period (%)

**Revenue Trends:**
- Line chart: Daily revenue (last 30/90/365 days)
- Bar chart: Monthly revenue (last 12 months)
- Year-over-year comparison
- Seasonality analysis

**Revenue Breakdown:**
- By shop (top performers)
- By city/region
- By order type (ASAP vs. scheduled)
- By customer segment (new vs. returning)

**Commission & Fees:**
- Total commission earned (platform revenue)
- Average commission rate
- Payment processing fees
- Net platform revenue

**[Screenshot placeholder: Revenue analytics charts]**

---

### Order Analytics

**Navigate to:** Analytics → Orders

**Order Volume:**
- Total orders (all-time, monthly, weekly, daily)
- Orders per hour (peak times)
- Orders per day of week
- Orders per shop (average)

**Order Status Distribution:**
- Completed (%)
- Cancelled (%)
- Average time to completion
- Cancellation reasons

**Order Value:**
- Average order value (AOV)
- AOV trends over time
- Median order value
- Order value distribution (histogram)

**Order Types:**
- ASAP vs. Scheduled (%)
- Mobile vs. Web (%)
- First-time vs. returning customer (%)

**[Screenshot placeholder: Order analytics]**

---

### User Analytics

**Navigate to:** Analytics → Users

**User Growth:**
- Total registered users
- New registrations per day/week/month
- Growth rate (%)
- User acquisition cost (if tracking)

**User Segments:**
- Customers (%)
- Shop Owners (%)
- Shop Workers (%)
- Admins (%)

**User Engagement:**
- Active users (last 7/30/90 days)
- Average orders per user
- Repeat customer rate (%)
- Customer lifetime value (CLV)

**User Retention:**
- Cohort analysis (monthly cohorts)
- Retention curves
- Churn rate (%)
- Win-back campaigns effectiveness

**[Screenshot placeholder: User growth chart]**

---

### Shop Analytics

**Navigate to:** Analytics → Shops

**Shop Growth:**
- Total active shops
- New shop applications per month
- Approval rate (%)
- Average time to approve

**Shop Performance:**
- Orders per shop (average)
- Revenue per shop (average)
- Distribution of shop performance (bell curve)
- Top 10% vs. bottom 10%

**Shop Engagement:**
- Shops active today (taking orders)
- Shops with orders in last 7/30 days
- Inactive shops (no orders in 30+ days)
- Average menu items per shop

**Shop Health:**
- Average rating
- Complaint rate
- Suspension rate
- Churn (shops leaving platform)

**[Screenshot placeholder: Shop performance distribution]**

---

### Loyalty Program Analytics

**Navigate to:** Analytics → Loyalty

**Program Participation:**
- Shops with loyalty enabled (%)
- Customers with loyalty points (%)
- Average points balance per customer
- Total points in circulation

**Points Economy:**
- Points earned (total, per month)
- Points redeemed (total, per month)
- Redemption rate (redeemed / earned %)
- Average value per point ($)

**Reward Performance:**
- Most popular rewards
- Rewards redeemed per shop
- Cost of rewards (shop perspective)
- Impact on repeat orders

**ROI Analysis:**
- Customer lifetime value: Loyalty vs. Non-loyalty
- Repeat purchase rate: Loyalty vs. Non-loyalty
- Average order value: Loyalty vs. Non-loyalty
- Loyalty program cost vs. revenue impact

**[Screenshot placeholder: Loyalty program metrics]**

---

### Exporting Analytics Data

**Export any report as:**
- **CSV** - For spreadsheet analysis (Excel, Google Sheets)
- **PDF** - For presentations or printing
- **JSON** - For integration with BI tools

**Steps to export:**
1. Navigate to desired analytics section
2. Set filters and date ranges
3. Click **"Export"** button (top right)
4. Select format
5. Choose detail level:
   - Summary only
   - Include details
   - Raw data dump
6. Click **"Download"**

**Scheduled Reports:**
- Set up automated email reports
- Choose frequency (daily, weekly, monthly)
- Select recipients (admin team)
- Configure included metrics

---

## Platform Configuration

Configure platform-wide settings and policies.

### Accessing Platform Settings

**Dashboard → Settings** (or **Platform Configuration** in navigation)

**[Screenshot placeholder: Platform settings interface]**

### General Settings

**Navigate to:** Settings → General

**Platform Information:**
- Platform name
- Support email
- Support phone
- Company address
- Platform timezone

**Business Settings:**
- Default commission rate (%)
- Payment processing fee (%)
- Payout schedule (daily, weekly, bi-weekly, monthly)
- Minimum payout threshold ($)

**Regional Settings:**
- Supported countries
- Supported currencies
- Tax calculation method
- Distance units (miles/km)

**[Screenshot placeholder: General settings]**

---

### Loyalty Program Settings

**Navigate to:** Settings → Loyalty

**Global Loyalty Configuration:**

**Points System:**
- Default points per dollar (1-50)
- Allow shops to customize rate (Yes/No)
- Minimum points per order
- Maximum points per order (fraud prevention)

**Points Expiration:**
- Points expire after X days (default: never)
- Warn customers X days before expiration
- Auto-expire unused points

**Rewards:**
- Minimum reward cost (points)
- Maximum reward value ($)
- Reward expiration after redemption (days)
- Allow unlimited reward redemptions per customer

**Program Rules:**
- Require loyalty program for all shops (Yes/No)
- Allow shop-specific rewards only (vs. platform-wide)
- Loyalty points transferable between shops (Yes/No)

**[Screenshot placeholder: Loyalty settings]**

---

### Order Settings

**Navigate to:** Settings → Orders

**Order Configuration:**

**Ordering:**
- Minimum order amount ($ - default $0)
- Maximum order amount ($ - default $500, fraud prevention)
- Allow scheduled orders (Yes/No)
- Max days in advance for scheduling (default 7)

**Order Timing:**
- Default prep time (minutes)
- Maximum prep time allowed (minutes)
- Cancellation window for customers (minutes)
- Auto-cancel orders after X minutes (if not accepted by shop)

**Order Notifications:**
- Send customer email confirmation (Yes/No)
- Send customer SMS updates (Yes/No)
- Push notification for status changes (Yes/No)
- Alert admins for high-value orders ($100+ - Yes/No)

**[Screenshot placeholder: Order settings]**

---

### Shop Settings

**Navigate to:** Settings → Shops

**Shop Application:**
- Require manual approval (Yes/No)
- Auto-approve after background check (Yes/No)
- Application review SLA (days)
- Required documents checklist

**Shop Onboarding:**
- Required onboarding steps (menu, logo, hours, etc.)
- Allow shop to go live before completing all steps (Yes/No)
- Send onboarding emails and reminders (Yes/No)

**Shop Operations:**
- Allow shops to self-suspend temporarily (Yes/No)
- Require minimum menu items (default 5)
- Require menu item images (Yes/No)
- Enforce business hours (prevent orders when closed - Yes/No)

**Shop Monitoring:**
- Auto-suspend shops with >20% cancellation rate (Yes/No)
- Auto-suspend shops with <3.0 rating (Yes/No)
- Alert admins for repeated customer complaints (threshold)

**[Screenshot placeholder: Shop settings]**

---

### Payment Settings

**Navigate to:** Settings → Payments

**Payment Configuration:**

**Payment Gateway:**
- Primary processor (Stripe, PayPal, etc.)
- Backup processor (failover)
- API credentials (secure vault)

**Payment Methods:**
- Accept credit/debit cards (Yes/No)
- Accept Apple Pay (Yes/No)
- Accept Google Pay (Yes/No)
- Accept gift cards (Yes/No)
- Accept loyalty points as payment (Yes/No)

**Processing:**
- Payment processing fee (% - passed to shops or absorbed)
- Refund policy (automatic, manual approval)
- Chargeback handling (automatic suspend shop, manual review)

**Payouts:**
- Payout schedule (daily, weekly, bi-weekly, monthly)
- Minimum payout amount ($50 default)
- Payout method (bank transfer, PayPal, check)
- Hold payouts for X days (fraud prevention - default 2 days)

**[Screenshot placeholder: Payment settings]**

---

### Security Settings

**Navigate to:** Settings → Security

**Authentication:**
- Require email verification (Yes/No)
- Require phone verification (Yes/No)
- Enforce strong passwords (Yes/No)
- Password minimum length (default 8)
- Require 2FA for admins (Yes/No - should always be Yes)
- Require 2FA for shop owners (Yes/No)

**Session Management:**
- Session timeout (minutes - default 60)
- Allow multiple concurrent sessions (Yes/No)
- Force logout on password change (Yes/No)

**Rate Limiting:**
- Max login attempts (default 5 per 15 min)
- Max API requests per minute (default 100)
- Lockout duration after failed attempts (minutes)

**IP Restrictions:**
- Whitelist admin IP addresses (optional, comma-separated)
- Blacklist known malicious IPs
- Block VPN/proxy access (Yes/No)

**Data Protection:**
- Encrypt sensitive data at rest (Yes/No - should always be Yes)
- PII data retention period (days - default 2555 / 7 years)
- Auto-delete inactive accounts after X days (optional)

**[Screenshot placeholder: Security settings]**

---

### Notification Settings

**Navigate to:** Settings → Notifications

**Email Notifications:**
- SMTP server configuration
- From email address
- From name
- Email templates (customize HTML templates)

**SMS Notifications:**
- SMS provider (Twilio, etc.)
- API credentials
- Default country code
- Opt-in required (Yes/No)

**Push Notifications:**
- Push notification provider (Firebase, OneSignal, etc.)
- API keys
- Notification sounds
- Badge counts

**Admin Alerts:**
- New shop applications (Yes/No)
- High-value orders (threshold: $)
- User reports/complaints (Yes/No)
- System errors (Yes/No)
- Security events (Yes/No)

**[Screenshot placeholder: Notification settings]**

---

### Maintenance Mode

**Navigate to:** Settings → Maintenance

**Maintenance Mode Toggle:**
- Enable/Disable maintenance mode
- When enabled:
  - Platform inaccessible to all users except admins
  - Shows maintenance page with message and estimated return time
  - Prevents new orders
  - Allows in-progress orders to complete

**Maintenance Configuration:**
- Custom maintenance message
- Estimated downtime (hours)
- Contact info for urgent issues
- Automatically disable at specific time

**Scheduled Maintenance:**
- Schedule maintenance window in advance
- Notify all users 24/48 hours ahead
- Auto-enable at scheduled time
- Auto-disable when complete

**[Screenshot placeholder: Maintenance mode settings]**

---

## Audit Logs

Track all administrative actions and system events for compliance and troubleshooting.

### Accessing Audit Logs

**Dashboard → Audit Logs** (or **Activity Log** in navigation)

**[Screenshot placeholder: Audit logs interface]**

### Audit Log Entries

**Each log entry includes:**
- **Timestamp** - Exact date and time (with timezone)
- **Actor** - Who performed the action (admin name, system)
- **Action Type** - What was done (create, update, delete, approve, suspend, etc.)
- **Resource** - What was affected (user, shop, order, setting)
- **Resource ID** - Specific identifier
- **Details** - Summary of changes
- **IP Address** - Where action originated
- **User Agent** - Browser/device info
- **Status** - Success, failed, partial

**[Screenshot placeholder: Audit log entry detail]**

### Filterable Event Types

**User Events:**
- User created/updated/deleted
- User role changed
- User suspended/reactivated
- Password reset performed
- 2FA enabled/disabled

**Shop Events:**
- Shop application approved/rejected
- Shop suspended/reactivated
- Shop featured/unfeatured
- Shop settings changed
- Shop deleted

**Order Events:**
- High-value orders ($100+)
- Refunds issued
- Chargebacks received
- Orders flagged for review

**Admin Events:**
- Admin login/logout
- Settings changes
- Maintenance mode enabled/disabled
- API key generated/revoked
- Bulk actions performed

**System Events:**
- Payment processing failures
- API errors
- Database migrations
- Security events
- Performance issues

---

### Searching & Filtering Logs

**Filter by:**
- Date range (today, last 7 days, last 30 days, custom)
- Actor (specific admin or system)
- Action type (select from dropdown)
- Resource type (users, shops, orders, settings)
- Status (success, failed)

**Search by:**
- Resource ID (user ID, shop ID, order number)
- IP address
- Text content in details

**Sort by:**
- Timestamp (newest first, oldest first)
- Actor
- Resource type

---

### Exporting Audit Logs

**For compliance or investigation:**

1. Set filters and date range
2. Click **"Export Logs"**
3. Select format:
   - CSV (for analysis)
   - JSON (for archival)
   - PDF (for reporting)
4. Choose scope:
   - Current filters only
   - All logs in date range
   - Specific resource logs
5. Click **"Download"**

**Audit logs are retained for 7 years minimum (compliance requirement)**

---

### Using Audit Logs for Investigation

**Common investigation scenarios:**

**Scenario 1: User reports unauthorized account changes**
1. Search logs for user ID
2. Filter by "User Updated" events
3. Check timestamps and actors
4. Verify IP addresses match user's typical locations
5. Identify if change was legitimate or compromised account

**Scenario 2: Shop claims they didn't suspend themselves**
1. Search logs for shop ID
2. Filter by "Shop Suspended" events
3. Check actor (was it admin or shop owner?)
4. Review reason and notes
5. Investigate if account was compromised

**Scenario 3: Platform revenue discrepancy**
1. Filter by date range of discrepancy
2. Show order and payment events
3. Look for failed payments, refunds, chargebacks
4. Export to CSV for financial reconciliation

---

## Security Best Practices

As an admin, you're responsible for platform security. Follow these best practices religiously.

### Admin Account Security

**Password Management:**
- ✅ Use 20+ character password
- ✅ Mix uppercase, lowercase, numbers, symbols
- ✅ Never reuse passwords from other sites
- ✅ Change password every 90 days
- ✅ Use password manager (1Password, LastPass, Bitwarden)
- ❌ Never share your password with anyone
- ❌ Never write password down

**Two-Factor Authentication (2FA):**
- ✅ Enable 2FA on your admin account (REQUIRED)
- ✅ Use authenticator app (Google Authenticator, Authy)
- ✅ Save backup codes securely
- ❌ Don't use SMS for 2FA (less secure)

**Session Management:**
- ✅ Log out when done with admin tasks
- ✅ Don't stay logged in overnight
- ✅ Review active sessions regularly
- ✅ Revoke old/unknown sessions immediately

---

### Device Security

**Computer/Laptop:**
- ✅ Keep OS and browsers updated
- ✅ Use antivirus/antimalware software
- ✅ Enable full-disk encryption
- ✅ Use screen lock (password required after 5 min idle)
- ✅ Don't share device with others
- ❌ Never admin from public/shared computers

**Network Security:**
- ✅ Use secure, private networks
- ✅ Use VPN when on public WiFi (if must admin remotely)
- ❌ Never admin from coffee shops, airports, hotels without VPN

**Browser Security:**
- ✅ Use dedicated browser profile for admin work
- ✅ Clear cookies/cache regularly
- ✅ Disable browser password saving for admin accounts
- ✅ Use HTTPS Everywhere extension
- ❌ Don't install untrusted browser extensions

---

### Access Control

**Principle of Least Privilege:**
- Only grant admin access to those who absolutely need it
- Use role-based access (full admin vs. limited admin)
- Review admin list quarterly
- Remove admin access immediately when no longer needed (employee leaves, role changes)

**Admin Role Types:**
- **Super Admin** - Full platform access (limit to 2-3 people)
- **Shop Admin** - Can manage shops and applications only
- **User Admin** - Can manage user accounts only
- **Support Admin** - Read-only access plus ability to handle support tickets
- **Finance Admin** - Can access financial data and reports only

**Admin Activity Monitoring:**
- Review audit logs weekly for admin actions
- Look for unusual patterns (late night logins, mass deletions, settings changes)
- Require approval for high-risk actions (deleting shops, changing payment settings)
- Alert on suspicious activity automatically

---

### Data Protection

**Sensitive Data:**
- Never share PII (personally identifiable information) externally
- Limit who can view financial data
- Encrypt exports containing sensitive data
- Don't email sensitive data (use secure file sharing)

**GDPR & Privacy Compliance:**
- Process deletion requests within 30 days
- Honor "do not track" preferences
- Maintain data processing records
- Have DPA (Data Processing Agreement) with shops
- Train all admins on privacy obligations

**Backup & Recovery:**
- Verify backups run daily
- Test restore process quarterly
- Store backups in multiple locations (offsite + cloud)
- Encrypt backup data
- Have disaster recovery plan documented

---

### Security Incident Response

**If you suspect a security breach:**

**Immediate Actions (within 1 hour):**
1. **Alert security team** - Don't investigate alone
2. **Preserve evidence** - Don't delete logs or data
3. **Contain breach** - Disable compromised accounts, block IPs
4. **Assess scope** - What data/systems are affected?

**Short-Term Actions (within 24 hours):**
5. **Investigate thoroughly** - Review audit logs, check for unauthorized access
6. **Notify affected parties** - Users, shops, payment processor (if applicable)
7. **Implement fixes** - Patch vulnerabilities, reset passwords, revoke keys
8. **Document incident** - Timeline, affected systems, actions taken

**Long-Term Actions (within 7 days):**
9. **Post-mortem** - What happened, why, how to prevent
10. **Update security policies** - Based on lessons learned
11. **Legal/compliance notifications** - If required by law (GDPR breach notification within 72 hours)
12. **Monitor for further activity** - Attackers may try again

**Emergency Contacts:**
- Security Team Lead: [Phone/Email]
- Platform Owner: [Phone/Email]
- Legal Counsel: [Phone/Email]
- Payment Processor Security: [Phone/Email]

---

## Troubleshooting & Maintenance

Common admin tasks and how to handle platform issues.

### Platform Health Monitoring

**Daily Checks:**
- ✅ Platform is accessible (visit customer site)
- ✅ No critical errors in system logs
- ✅ Payment processing is working
- ✅ Email/SMS notifications sending
- ✅ No sudden drop in orders (may indicate issue)

**Weekly Checks:**
- ✅ Review performance metrics (page load times, API response times)
- ✅ Database health (size, backups, slow queries)
- ✅ Storage capacity (images, logs)
- ✅ Pending shop applications queue
- ✅ Unresolved support tickets

**Monthly Checks:**
- ✅ Security patches applied
- ✅ SSL certificates valid (not expiring soon)
- ✅ Third-party integrations working (payment processor, SMS, email)
- ✅ Review user feedback and complaints
- ✅ Audit log review (admin activity)

---

### Common Issues & Solutions

#### Issue: Platform Running Slowly

**Symptoms:** Pages loading slowly, timeouts, users complaining

**Diagnosis:**
1. Check server resource usage (CPU, memory, disk)
2. Review recent code deployments (was there a recent release?)
3. Check database performance (slow queries)
4. Look for traffic spikes (DDoS attack, viral marketing?)

**Solutions:**
- Scale up servers (add more capacity)
- Optimize slow database queries
- Enable caching (Redis, CDN)
- Block malicious traffic (if DDoS)
- Rollback recent deployment (if caused by new code)

---

#### Issue: Payment Processing Failing

**Symptoms:** Orders stuck in pending, customers reporting payment declined

**Diagnosis:**
1. Check payment processor status page (Stripe, PayPal, etc.)
2. Review payment logs for error messages
3. Verify API keys are valid (not expired)
4. Test with your own card (does it work?)

**Solutions:**
- If processor is down: Wait and notify users of issue
- If API keys invalid: Regenerate and update settings
- If configuration issue: Fix payment settings
- If individual card issues: Contact customer directly
- Enable backup payment processor (if available)

**Communication:**
- Post status update for users
- Notify shops of payment delays
- Process manual refunds if needed

---

#### Issue: Email/SMS Notifications Not Sending

**Symptoms:** Customers not receiving order confirmations

**Diagnosis:**
1. Check notification settings (enabled?)
2. Review email/SMS provider status
3. Check sending limits (did we hit daily quota?)
4. Look for authentication errors in logs

**Solutions:**
- Verify SMTP/API credentials
- Increase sending limits with provider
- Check spam filters (emails being blocked?)
- Resend failed notifications manually
- Switch to backup provider

**Prevention:**
- Monitor daily email/SMS send volume
- Set up alerts for failures
- Have backup notification provider configured

---

#### Issue: Shops Not Receiving Orders

**Symptoms:** Shop reports no orders showing in queue

**Diagnosis:**
1. Check if shop status is Active
2. Verify shop hours configured (are they "open" now?)
3. Check if menu has available items
4. Look for orders in admin panel (are they being placed?)
5. Test order flow yourself

**Solutions:**
- Reactivate shop if suspended
- Update business hours if incorrect
- Mark menu items as available
- Check for technical issues in order routing
- Restart shop's worker session

**Communication:**
- Contact shop owner to verify resolution
- Compensate shop if orders were lost
- Review why issue occurred to prevent recurrence

---

## Emergency Procedures

Critical situations requiring immediate action.

### Emergency Contact Tree

**Level 1 - On-Duty Admin:**
- Monitor alerts 24/7
- Respond to critical issues within 15 minutes
- Escalate if needed

**Level 2 - Senior Admin / Platform Lead:**
- Handle escalated issues
- Make major platform decisions (suspend shops, enable maintenance mode)
- Coordinate with engineering team

**Level 3 - Platform Owner / CTO:**
- Handle security breaches
- Make business-critical decisions
- Interface with legal/compliance
- Public communications

---

### Critical Alert Types

#### 🔴 P0 - Critical (Platform Down)

**Examples:**
- Platform inaccessible to all users
- Database failure
- Payment processing completely down
- Security breach in progress

**Response:**
1. **Alert entire team immediately** (phone call, not just email/Slack)
2. **Enable maintenance mode** (if platform partially functional)
3. **Post status update** on status page and social media
4. **Investigate and fix ASAP** - all hands on deck
5. **Communicate updates every 30 minutes**
6. **Post-mortem required** after resolution

**SLA:** Acknowledge within 15 minutes, resolve within 2 hours

---

#### 🟠 P1 - High (Major Functionality Broken)

**Examples:**
- Specific feature broken (ordering works but notifications don't)
- Payment processing intermittent
- Single shop unable to receive orders
- Performance severely degraded

**Response:**
1. **Alert on-duty admin and engineering**
2. **Assess scope** - how many users affected?
3. **Implement workaround** if possible
4. **Communicate to affected users**
5. **Fix within 24 hours**

**SLA:** Acknowledge within 1 hour, resolve within 24 hours

---

#### 🟡 P2 - Medium (Minor Functionality Broken)

**Examples:**
- Non-critical feature not working (analytics, export)
- Cosmetic issues
- Specific edge case failing

**Response:**
1. **Log issue** in ticketing system
2. **Assign to appropriate team member**
3. **Fix within 1 week**

**SLA:** Acknowledge within 4 hours, resolve within 7 days

---

### Platform-Wide Outage Procedure

**Step 1: Assess (0-5 minutes)**
- What's down? (entire platform, specific feature, specific region)
- When did it start? (check monitoring tools)
- How many users affected? (all, subset, single user)

**Step 2: Communicate (5-10 minutes)**
- Enable maintenance mode (if possible)
- Post status update: "We're aware of an issue and investigating"
- Alert internal team
- Notify payment processor (if payment-related)

**Step 3: Investigate (10-30 minutes)**
- Check server health
- Review recent deployments
- Check external dependencies (AWS, payment processor, etc.)
- Review error logs

**Step 4: Resolve (30 minutes - 2 hours)**
- Implement fix (or rollback deployment)
- Test thoroughly before re-enabling
- Monitor closely after resolution

**Step 5: Communicate Resolution**
- Disable maintenance mode
- Post resolution update
- Send apology email to affected users
- Offer compensation if significant downtime (loyalty points, service credits)

**Step 6: Post-Mortem (within 48 hours)**
- Document what happened
- Root cause analysis
- Identify prevention measures
- Update runbooks

---

### Security Breach Procedure

**Covered in Security Best Practices section above** - refer to Security Incident Response

---

### Data Loss Procedure

**If data is accidentally deleted or corrupted:**

**Step 1: Stop the bleeding**
- Disable the process/feature causing data loss
- Prevent further deletions

**Step 2: Assess damage**
- What data was lost?
- How many records?
- When did loss occur?

**Step 3: Restore from backup**
- Identify most recent clean backup
- Test restore in staging environment first
- Restore to production
- Verify data integrity

**Step 4: Notify affected parties**
- If user data lost: Email each affected user
- If shop data lost: Call shop owners directly
- Offer compensation

**Step 5: Prevent recurrence**
- Fix bug that caused data loss
- Implement additional safeguards (soft deletes, confirmation dialogs)
- More frequent backups

---

## Conclusion

As a LoyalCup Administrator, you play a critical role in maintaining a healthy, secure, and thriving platform. This guide covers the essentials, but don't hesitate to ask questions or suggest improvements.

**Key Responsibilities Summary:**
- ✅ Review and approve shop applications promptly
- ✅ Monitor platform health and address issues quickly
- ✅ Maintain security and protect user data
- ✅ Respond to escalated support issues
- ✅ Analyze trends and optimize platform performance
- ✅ Communicate proactively during incidents
- ✅ Document everything for audit and knowledge sharing

**Admin Resources:**
- 📚 **Admin Documentation:** loyalcup.com/admin/docs
- 💬 **Admin Slack Channel:** #loyalcup-admins
- 📊 **Status Page:** status.loyalcup.com
- 🔧 **Engineering Team:** engineering@loyalcup.com
- 🆘 **Emergency Line:** 1-800-LOYALCUP ext. 911

**Thank you for keeping LoyalCup running smoothly!** ☕🛡️

---

*Last updated: [Current Date]*  
*Version 1.0*  
*For admin questions or feedback, contact admin-team@loyalcup.com*

**CONFIDENTIAL - FOR AUTHORIZED ADMINISTRATORS ONLY**
