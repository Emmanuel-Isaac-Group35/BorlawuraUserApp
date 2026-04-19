import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  // Check if we are running in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('⚠️ SDK 53+ Alert: Android Push Notifications are not supported in Expo Go.');
    console.warn('To test push notifications, you must use a Development Build (npx expo run:android).');
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
      console.log('Error setting notification channel:', e);
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permission not granted for notifications');
      return;
    }
    
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        console.log('Error getting push token (this is expected in Expo Go for Android):', e);
    }
  } else {
    console.log('Note: Physical device recommended for full push notification testing');
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string, data = {}) {
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
    console.log('Local notification failed (not supported in this environment):', e);
  }
}
