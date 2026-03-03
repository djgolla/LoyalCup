// App.js
// This is the root component of the application.
// It sets up the NavigationContainer which is essential for routing.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}