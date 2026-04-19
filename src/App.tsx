import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { ErrorBoundary } from './components/ErrorBoundary';
import SplashView from './components/SplashView';

enableScreens();
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  useFonts, 
  Montserrat_400Regular, 
  Montserrat_500Medium, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';

// Import pages
import HomePage from './pages/home/page';
import AuthPage from './pages/auth/page';
import SignupPage from './pages/auth/signup';
import OTPPage from './pages/auth/otp';
import ForgotPasswordPage from './pages/auth/forgot-password';
import ResetPasswordPage from './pages/auth/reset-password';
import BookingPage from './pages/booking/page';
import OrdersPage from './pages/orders/page';
import ServicesPage from './pages/services/page';
import ProfilePage from './pages/profile/page';
import SupportPage from './pages/support/page';
import SupportChatPage from './pages/support/chat';
import TrackOrderPage from './pages/track-order/page';
import NotificationsPage from './pages/profile/notifications/page';
import TermsPage from './pages/profile/terms/page';
import AboutPage from './pages/profile/about/page';
import NotFound from './pages/NotFound';
import ChatbotPage from './pages/chatbot/page';
import RiderChatPage from './pages/chat-rider/page';
import { NotificationOverlay } from './components/feature/NotificationOverlay';
import { BottomNavigation } from './components/feature/BottomNavigation';

// Import navigation utility
import { navigationRef } from './utils/navigation';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'borlawura-user://'],
  config: {
    screens: {
      Auth: 'auth-callback',
      ResetPassword: 'reset-password'
    },
  },
};

import { GlobalOrderListener } from './components/feature/GlobalOrderListener';

import SavedAddressesPage from './pages/profile/addresses/page';

function AppNavigator() {
  const { isLoggedIn, isSuspended, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? (isSuspended ? "Auth" : "Home") : "Auth"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        {!isLoggedIn || isSuspended ? (
          <>
            <Stack.Screen name="Auth" component={AuthPage} />
            <Stack.Screen name="Signup" component={SignupPage} />
            <Stack.Screen name="OTP" component={OTPPage} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordPage} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordPage} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomePage} />
            <Stack.Screen name="Booking" component={BookingPage} />
            <Stack.Screen name="Orders" component={OrdersPage} />
            <Stack.Screen name="Services" component={ServicesPage} />
            <Stack.Screen name="Profile" component={ProfilePage} />
            <Stack.Screen name="SavedAddresses" component={SavedAddressesPage} />
            <Stack.Screen name="Support" component={SupportPage} />
            <Stack.Screen name="SupportChat" component={SupportChatPage} />
            <Stack.Screen name="TrackOrder" component={TrackOrderPage} />
            <Stack.Screen name="Notifications" component={NotificationsPage} />
            <Stack.Screen name="Terms" component={TermsPage} />
            <Stack.Screen name="About" component={AboutPage} />
            <Stack.Screen name="Chatbot" component={ChatbotPage} />
            <Stack.Screen name="RiderChat" component={RiderChatPage} />
          </>
        )}
        <Stack.Screen name="NotFound" component={NotFound} />
      </Stack.Navigator>
      <BottomNavigation />
      <GlobalOrderListener />
    </NavigationContainer>
  );
}

import { SettingsProvider } from './context/SettingsContext';
import { AlertProvider } from './context/AlertContext';
import { MaintenanceOverlay } from './components/feature/MaintenanceOverlay';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500); // reduced from 5 seconds to 1.5s to speed up app loading

    return () => clearTimeout(timer);
  }, []);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat': Montserrat_400Regular, // Default fallback
  });

  if (showSplash || !fontsLoaded) {
    return <SplashView />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AlertProvider>
            <SafeAreaProvider>
              <AppNavigator />
              <NotificationOverlay />
              <MaintenanceOverlay />
            </SafeAreaProvider>
          </AlertProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
