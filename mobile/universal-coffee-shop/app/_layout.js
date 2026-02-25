// main navigation layout file
// universal-coffee-shop/app/_layout.js
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[0];
    
    // redirect based on auth state
    if (!user && currentScreen !== 'launch' && currentScreen !== 'login' && currentScreen !== 'signup') {
      // User not authenticated - send to launch
      router.replace('/launch');
    } else if (user && (currentScreen === 'launch' || currentScreen === 'login' || currentScreen === 'signup' || !currentScreen)) {
      // User authenticated but on auth screens or index - send to home
      router.replace('/home');
    }
  }, [user, loading, segments]);

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
      // Hide the splash screen after the fonts have loaded (or an error was returned)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until the fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render the layout wrapped in providers
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