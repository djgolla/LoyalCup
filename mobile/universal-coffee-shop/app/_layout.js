import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import {
  registerForPushNotifications,
  clearPushToken,
} from '../services/notificationService';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const hadUserRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    const currentScreen = segments[0];

    const guestAllowedScreens = [
      'index',
      'launch',
      'login',
      'signup',
      'home',
      'shop',
      'about',
      'help',
    ];

    const accountRequiredScreens = [
      'cart',
      'checkout',
      'favorites',
      'rewards',
      'profile',
      'settings',
      'order-history',
      'payment-methods',
      'saved-addresses',
      'order',
    ];

    if (!user && accountRequiredScreens.includes(currentScreen)) {
      router.replace('/login');
      return;
    }

    if (
      user &&
      (
        currentScreen === 'index' ||
        currentScreen === 'launch' ||
        currentScreen === 'login' ||
        currentScreen === 'signup' ||
        !currentScreen
      )
    ) {
      router.replace('/home');
      return;
    }

    if (!user && !guestAllowedScreens.includes(currentScreen)) {
      router.replace('/launch');
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (loading) return;

    if (user) {
      hadUserRef.current = true;

      registerForPushNotifications();

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log('[Push] Received:', notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const orderId =
            response.notification.request.content.data?.order_id;

          if (orderId) {
            router.push(`/order/${orderId}`);
          }
        });
    } else if (hadUserRef.current) {
      clearPushToken();
      hadUserRef.current = false;
    }

    return () => {
      notificationListener.current?.remove?.();
      responseListener.current?.remove?.();
      notificationListener.current = null;
      responseListener.current = null;
    };
  }, [user, loading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="launch" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-history" />
      <Stack.Screen name="shop/[id]" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="saved-addresses" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Anton-Regular': require('../assets/fonts/Anton-Regular.ttf'),
    Canopee: require('../assets/fonts/Canopee.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}