const googleMapsApiKey = 'dummy_key_to_prevent_crash';

/** @type {import('expo/config').ExpoConfig} */
export default {
  expo: {
    name: 'Borlawura',
    slug: 'borlawura-user',
    scheme: 'borlawura-user',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.borlawura.user',
      ...(googleMapsApiKey ? {
        config: {
          googleMapsApiKey,
        },
      } : {}),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.borlawura.user',
      ...(googleMapsApiKey ? {
        config: {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      } : {}),
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-location',
      'expo-font',
      'expo-web-browser',
      'expo-notifications',
    ],
    extra: {
      eas: {
        projectId: '4f4bd654-54e3-49f1-8fb8-638a199c36f2',
      },
    },
  },
};
