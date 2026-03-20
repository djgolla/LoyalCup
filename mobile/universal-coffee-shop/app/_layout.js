// main navigation layout file
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { registerForPushNotifications, clearPushToken } from '../services/notificationService';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Auth-based routing
  useEffect(() => {
    if (loading) return;
    const currentScreen = segments[0];
    if (!user && currentScreen !== 'launch' && currentScreen !== 'login' && currentScreen !== 'signup') {
      router.replace('/launch');
    } else if (user && (currentScreen === 'launch' || currentScreen === 'login' || currentScreen === 'signup' || !currentScreen)) {
      router.replace('/home');
    }
  }, [user, loading, segments]);

  // Push notifications
  useEffect(() => {
    if (user) {
      // Register & save token when user logs in
      registerForPushNotifications();

      // Listen for foreground notifications
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('[Push] Received:', notification);
      });

      // Handle tap on notification — navigate to order screen
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const orderId = response.notification.request.content.data?.order_id;
        if (orderId) {
          router.push(`/order/${orderId}`);
        }
      });
    } else {
      // User logged out — clear token
      clearPushToken();
    }

    return () => {
      // Use .remove() — the modern API for expo-notifications subscriptions
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

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
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Anton-Regular': require('../assets/fonts/Anton-Regular.ttf'),
    'Canopee': require('../assets/fonts/Canopee.ttf'),
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