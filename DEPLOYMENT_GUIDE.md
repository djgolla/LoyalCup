# LoyalCup Deployment Guide

Complete guide for deploying LoyalCup to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Web Frontend Deployment](#web-frontend-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Accounts
- **Supabase** - Database and authentication
- **Vercel/Netlify** - Web frontend hosting (recommended)
- **Railway/Render/Heroku** - Backend API hosting
- **Expo** - Mobile app builds and OTA updates
- **SendGrid** - Email service (optional)
- **Sentry** - Error tracking (optional)

### Required Tools
- Node.js 20+ and npm
- Python 3.11+
- Git
- Docker (optional, for containerized deployments)

---

## Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Save the following credentials:
   - Project URL
   - Anon/Public key
   - Service role key
   - JWT secret

### 2. Run Database Migrations
In your Supabase dashboard, go to SQL Editor and run migrations in order:

```sql
-- Run in this exact order:
-- 1. supabase/migrations/001_init.sql
-- 2. supabase/migrations/002_admin_features.sql
-- 3. supabase/migrations/003_production_ready.sql
-- 4. supabase/migrations/004_production_optimizations.sql
-- 5. supabase/migrations/005_advanced_features.sql
```

### 3. Set Up Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create new bucket named `shop-images`
3. Set as public bucket
4. Configure policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-images');

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'shop-images');
```

### 4. Create Admin User
Run this in SQL Editor:
```sql
-- Get a user ID from profiles table
INSERT INTO profiles (id, email, full_name, role)
VALUES (auth.uid(), 'admin@loyalcup.com', 'Admin User', 'admin');
```

Then sign up through your app with that email to link it.

---

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init
```

2. **Set Environment Variables**
In Railway dashboard, add all environment variables from `.env.example`

3. **Deploy**
```bash
railway up
```

Railway will automatically:
- Detect Python
- Install dependencies from requirements.txt
- Start uvicorn server

### Option 2: Render

1. **Create Web Service**
   - Go to render.com dashboard
   - New > Web Service
   - Connect GitHub repository

2. **Configure Service**
   - Name: loyalcup-api
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   Copy from `.env.example` and fill in actual values

### Option 3: Docker + Any Platform

```bash
cd backend
docker build -t loyalcup-backend .
docker run -p 8000:8000 --env-file .env loyalcup-backend
```

Deploy the image to:
- Google Cloud Run
- AWS ECS
- Azure Container Instances
- DigitalOcean App Platform

---

## Web Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd web
vercel --prod
```

3. **Set Environment Variables**
In Vercel dashboard:
```
VITE_API_BASE_URL=https://your-backend-url.railway.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Redeploy**
```bash
vercel --prod
```

### Option 2: Netlify

1. **Build Locally**
```bash
cd web
npm install
npm run build
```

2. **Deploy via Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Or connect GitHub repo in Netlify dashboard with these settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Base directory: `web`

### Option 3: Static Hosting (S3, GCS, Azure Storage)

```bash
cd web
npm install
npm run build

# Upload dist/ folder contents to your storage bucket
# Configure as static website
# Add CloudFront/CDN for HTTPS
```

---

## Mobile App Deployment

### Prerequisites
- Expo account
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)

### 1. Configure EAS Build

```bash
cd mobile/universal-coffee-shop
npm install -g eas-cli
eas login
```

Create `eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/api-key.json"
      }
    }
  }
}
```

### 2. Build for iOS

```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

### 3. Build for Android

```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

### 4. Configure OTA Updates

```bash
# Set up update channel
eas update:configure

# Push update
eas update --branch production --message "Bug fixes and improvements"
```

---

## Environment Variables

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret

# Application
ENVIRONMENT=production
API_TITLE=LoyalCup API
API_VERSION=1.0.0

# CORS (add your domains)
CORS_ORIGINS=["https://loyalcup.com","https://www.loyalcup.com"]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# SendGrid (optional)
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@loyalcup.com

# Redis (optional, for advanced rate limiting)
REDIS_URL=redis://your-redis-host:6379
```

### Web Frontend
```bash
VITE_API_BASE_URL=https://api.loyalcup.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile App (.env)
```bash
EXPO_PUBLIC_API_BASE_URL=https://api.loyalcup.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Post-Deployment

### 1. Verify Deployments

**Backend**
```bash
curl https://your-api-url.com/health
# Should return: {"status":"healthy",...}
```

**Web**
- Visit https://your-web-url.com
- Check browser console for errors
- Test login and signup

**Mobile**
- Download from TestFlight/Internal Testing
- Test all core flows

### 2. Configure Custom Domain

**Backend (Railway)**
```bash
railway domain
```

**Web (Vercel)**
- Go to project settings
- Add custom domain
- Update DNS records

### 3. Set Up Monitoring

**Sentry**
1. Create project in Sentry
2. Add DSN to environment variables
3. Test by triggering an error

**Analytics**
- Set up Google Analytics
- Add tracking code to web frontend
- Monitor user flows

### 4. Performance Optimization

**Database**
```sql
-- Run analytics refresh daily
SELECT refresh_shop_analytics();

-- Monitor slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;
```

**CDN**
- Enable CloudFlare for web frontend
- Configure caching rules
- Enable DDoS protection

### 5. Backup Strategy

**Database**
- Enable daily backups in Supabase
- Export critical data weekly
- Test restore procedure

**Code**
- Tag releases in Git
- Document breaking changes
- Keep changelog updated

---

## Scaling Considerations

### When to Scale

**Backend**
- Response times > 1 second
- CPU usage > 80%
- Memory usage > 80%
- Database connections maxed out

**Database**
- Query times > 500ms
- Connection pool exhausted
- Storage > 80% full

### How to Scale

**Backend**
- Increase Railway/Render instance size
- Add horizontal replicas
- Implement Redis caching
- Use background workers for heavy tasks

**Database**
- Upgrade Supabase plan
- Add read replicas
- Implement connection pooling
- Optimize slow queries

**Frontend**
- Enable CDN caching
- Implement lazy loading
- Code splitting
- Optimize images

---

## Troubleshooting

### Backend Issues

**503 Service Unavailable**
- Check health endpoint
- Verify environment variables
- Check logs: `railway logs` or check Render dashboard

**CORS Errors**
- Verify CORS_ORIGINS includes your frontend URL
- Check protocol (http vs https)

**Database Connection Failed**
- Verify Supabase credentials
- Check if IP is whitelisted (if applicable)
- Test connection from local machine

### Web Frontend Issues

**Blank Page**
- Check browser console
- Verify API URL is correct
- Check if backend is running

**Authentication Failed**
- Verify Supabase credentials match backend
- Check JWT_SECRET matches
- Clear browser cache and cookies

### Mobile App Issues

**Build Failed**
- Check eas-cli version: `eas --version`
- Verify app.json configuration
- Check for dependency conflicts

**App Crashes on Launch**
- Check Expo logs
- Verify environment variables
- Test in Expo Go first

---

## Security Checklist

- [ ] All environment variables set correctly
- [ ] No secrets in code or version control
- [ ] HTTPS enabled on all services
- [ ] CORS restricted to known origins
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Error tracking (Sentry) enabled
- [ ] Security headers configured
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Input validation on all forms
- [ ] File upload restrictions in place
- [ ] API authentication required

---

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Search GitHub issues
4. Create new issue with:
   - Platform (Railway, Vercel, etc.)
   - Error messages
   - Steps to reproduce

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Environment variables prepared
- [ ] Backup created

### Deployment
- [ ] Database migrations run
- [ ] Backend deployed
- [ ] Web frontend deployed
- [ ] Mobile app built
- [ ] Environment variables set

### Post-Deployment
- [ ] Health checks passing
- [ ] Login working
- [ ] Core features tested
- [ ] Monitoring enabled
- [ ] Team notified

---

**Last Updated:** 2026-02-03  
**Version:** 1.0.0
