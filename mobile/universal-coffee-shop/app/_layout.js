// main navigation layout file
// universal-coffee-shop/app/_layout.js
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// TODO NEED TO FIX THIS - AUTH NOT SET UP YET, using mock auth for now to test
const useAuth = () => ({ user: null }); // Mock auth hook

function RootLayoutNav() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    // uncomment this / change this once we have auth from back end
    // if (user && !inAuthGroup) {
    //   router.replace('/home');
    // } else if (!user) {
    //   router.replace('/launch');
    // }
  }, [user, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="launch" />
      <Stack.Screen name="login" />
      <Stack.Screen name="home" />
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

  // Render the layout wrapped in the Gesture Handler
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}