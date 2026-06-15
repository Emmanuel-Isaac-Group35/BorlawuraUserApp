import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// ── Detect Expo Go (SDK 53+ lost remote push support) ──────────────────────
const executionEnv = (Constants as any).executionEnvironment || '';
const isExpoGo = executionEnv === 'storeClient';

// ── Only set the handler if the notifications module is functional ──────────
// Foreground behavior: show alerts even if app is open
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.log('[Notifications] Handler setup skipped:', e);
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Expo Go on Android SDK 53+ does not support remote push notifications
  if (isExpoGo && Platform.OS === 'android') {
    console.log('[Notifications] Remote push tokens skipped in Expo Go (Android SDK 53+).');
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
      console.log('[Notifications] Error setting channel:', e);
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
    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    if (!projectId) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    console.log('[Notifications] Error getting push token:', e);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  // Local notifications ARE supported in Expo Go, though some features vary.
  // We allow them here so developers can test the "Rider Arrived" flows.
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
    // Fallback for extreme cases (if library is completely unusable in Go)
    if (isExpoGo) {
       console.log(`[ALERT FALLBACK] ${title}: ${body}`);
    }
  }
}
