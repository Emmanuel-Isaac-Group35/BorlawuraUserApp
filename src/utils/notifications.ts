import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ── Detect Expo Go (SDK 53+ lost remote push support) ──────────────────────
const executionEnv = (Constants as any).executionEnvironment || '';
const isExpoGo = executionEnv === 'storeClient';

// ── Only set the handler if the notifications module is functional ──────────
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('[Notifications] Handler setup skipped (Expo Go limitation):', e);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go on Android SDK 53+ does not support remote push notifications
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('[Notifications] Remote push notifications are not supported in Expo Go on Android SDK 53+. Use a development build.');
    return null;
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });
    } catch (e) {
      console.log('[Notifications] Error setting notification channel:', e);
    }
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Physical device recommended for push notification testing.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Notifications] No EAS projectId found — push token skipped.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    console.log('[Notifications] Error getting push token (expected in Expo Go for Android):', e);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  // Guard: local notifications also have limited support in Expo Go
  if (isExpoGo) {
    console.log(`[Notifications] Local notification suppressed in Expo Go: "${title}" — ${body}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // trigger immediately
    });
  } catch (e) {
    console.log('[Notifications] Local notification failed:', e);
  }
}
