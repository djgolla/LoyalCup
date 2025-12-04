# ☕ LoyalCup

> Empowering local coffee shops with modern mobile ordering - giving each shop their own Starbucks-like experience.

## 🚀 Overview

LoyalCup is a mobile ordering platform designed specifically for small, independent coffee shops. Think of it as "DoorDash for local coffee shops" - we provide the technology infrastructure that allows local businesses to compete with major chains by offering their customers a seamless, modern ordering experience.

## 🛠️ Tech Stack

### Frontend
- **Web App**: React + Vite
- **Mobile App**: React Native + Expo

### Backend
- **API**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

### Additional Services
- **Payments**: Stripe
- **OAuth**: Google Sign-In

## 📁 Project Structure

This is a monorepo containing all components of the LoyalCup platform:

```
LoyalCup/
├── web/                      # 🌐 Vite + React web application
├── mobile/                   # 📱 React Native + Expo mobile app
├── backend/                  # ⚙️ FastAPI backend service
├── supabase/                 # 🗄️ Database migrations & configuration
└── shared/                   # 🔄 Shared types, constants, and utilities
```

### Directory Details

- **web/** - Customer-facing web application for browsing and ordering
- **mobile/** - Native mobile app for iOS and Android
- **backend/** - FastAPI REST API and business logic
- **supabase/** - Database schema, migrations, and Supabase configuration
- **shared/** - Shared TypeScript types and utilities used across frontend apps

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Supabase CLI** (for local development)
- **Expo CLI** (for mobile development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/djgolla/LoyalCup.git
   cd LoyalCup
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Start developing**
   - Navigate to the directory you want to work on (web, mobile, or backend)
   - Each directory will contain its own setup instructions as the project develops

## 📚 Development

As the project evolves, each component will have its own setup instructions and documentation. For now, the foundation is in place to start building!

## 🤝 Contributing

This is currently a private project in development. Contribution guidelines will be added as the project matures.

## 📄 License

Copyright © 2024 LoyalCup. All rights reserved.
