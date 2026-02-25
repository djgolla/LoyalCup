# Universal Coffee Shop Mobile App

Coffee shop app allowing users to view menus, place orders, and earn loyalty points.
Mobile front-end + Supabase backend for LoyalCup project.

## Tech Stack

- **Framework**: React Native with Expo
- **Authentication**: Supabase Auth
- **Backend**: Supabase + FastAPI
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio (for Android emulator)
- Expo Go app on physical device (optional)

## Setup Instructions

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables

   Copy the example environment file and fill in your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. Start the development server

   ```bash
   npm start
   ```

   Or use specific platforms:
   ```bash
   npm run ios       # iOS simulator
   npm run android   # Android emulator
   npm run web       # Web browser
   ```

## Project Structure

```
mobile/universal-coffee-shop/
├── app/                    # Screens (file-based routing)
│   ├── _layout.js         # Root layout with providers
│   ├── index.js           # Entry point
│   ├── launch.js          # Launch screen
│   ├── login.js           # Login screen
│   ├── signup.js          # Signup screen
│   ├── home.js            # Home/Shop list screen
│   ├── profile.js         # User profile
│   ├── cart.js            # Shopping cart
│   ├── checkout.js        # Checkout flow
│   ├── order-history.js   # Order history
│   ├── shop/[id].js       # Shop detail & menu
│   └── order/[id].js      # Order tracking
├── components/            # Reusable UI components
│   ├── CoffeeShopCard.js
│   ├── MenuItemCard.js
│   ├── LoadingSkeleton.js
│   └── ErrorMessage.js
├── context/              # React Context providers
│   ├── AuthContext.js    # Authentication state
│   └── CartContext.js    # Shopping cart state
├── services/             # API service layer
│   ├── api.js           # Base API config
│   ├── authService.js
│   ├── shopService.js
│   ├── orderService.js
│   ├── loyaltyService.js
│   └── userService.js
└── lib/
    └── supabase.js       # Supabase client config
```

## Features

### Authentication
- Email/password signup and login
- Google OAuth (configured in Supabase)
- Persistent sessions with AsyncStorage
- Auto token refresh

### Shop Discovery
- Browse nearby coffee shops
- Search functionality
- View shop details and menus
- Favorite shops

### Ordering
- Add items to cart
- Customize orders
- Checkout flow
- Real-time order tracking
- Order history

### Loyalty Program
- Earn points on orders
- View points balance
- Redeem rewards

## Navigation Flow

```
Launch Screen
  ↓
Login/Signup → Home (Shop List)
                ↓
              Shop Detail → Add to Cart
                            ↓
                          Cart → Checkout → Order Confirmation
                                               ↓
                                           Order Tracking

Profile:
  - Account Info
  - Order History
  - Loyalty Points
  - Settings
```

## API Integration

The app connects to:
- **Supabase**: Authentication and real-time features
- **FastAPI Backend**: Shop data, orders, and loyalty

API calls are handled through service modules in `services/` with automatic authentication token injection.

## Development

### Running on Physical Device

1. Install Expo Go app on your device
2. Make sure your device is on the same network as your dev machine
3. Run `npm start` and scan the QR code with Expo Go

### Debugging

- Use React Native Debugger or Chrome DevTools
- Check console logs for API errors
- View network requests in browser dev tools

## Testing

Currently no automated tests. Manual testing recommended:
1. Test auth flow (signup, login, logout)
2. Test shop browsing and search
3. Test cart operations
4. Test order placement and tracking
5. Test on both iOS and Android

## Deployment

### iOS (via Expo)
```bash
expo build:ios
```

### Android (via Expo)
```bash
expo build:android
```

For production builds, see [Expo's deployment guide](https://docs.expo.dev/distribution/introduction/).

## Troubleshooting

**App won't start:**
- Clear Expo cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Auth not working:**
- Check Supabase credentials in .env
- Verify Supabase project is configured correctly
- Check network connectivity

**API calls failing:**
- Ensure backend is running
- Check API_URL in .env
- Verify CORS settings on backend

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase React Native guide](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
- [React Native docs](https://reactnative.dev/)
