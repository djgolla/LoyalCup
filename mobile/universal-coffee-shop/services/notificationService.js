import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications and save the token to the user's profile.
 * Call this once after the user logs in.
 */
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('[Push] Skipping — not a physical device');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d97706',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '0fa283e2-bdab-464a-9a3c-86e60a67c5ba', // from app.json extra.eas.projectId
    });
    const token = tokenData.data;
    console.log('[Push] Expo push token:', token);

    await apiClient.put('/api/v1/users/profile', { push_token: token });
    console.log('[Push] Token saved to profile');

    return token;
  } catch (err) {
    console.warn('[Push] Error getting token:', err);
    return null;
  }
}

/**
 * Clear push token on logout so we don't send notifications to signed-out users.
 */
export async function clearPushToken() {
  try {
    await apiClient.put('/api/v1/users/profile', { push_token: null });
  } catch (err) {
    console.warn('[Push] Failed to clear token:', err);
  }
}
