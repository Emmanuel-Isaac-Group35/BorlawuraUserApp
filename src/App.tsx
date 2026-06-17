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
import SettingsPage from './pages/profile/settings/page';
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
import PaymentMethodsPage from './pages/profile/payment-methods/page';

function AppNavigator() {
  const { isLoggedIn, isSuspended, isInitialLoading } = useAuth();

  // #region debug-point C:app-navigator-state
  fetch("http://192.168.137.166:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"user-app-startup",runId:"pre-fix",hypothesisId:"C",location:"src/App.tsx:69",msg:"[DEBUG] AppNavigator render",data:{isLoggedIn,isSuspended,isInitialLoading},ts:Date.now()})}).catch(()=>{});
  // #endregion

  if (isInitialLoading) return <SplashView />;

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
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsPage} />
            <Stack.Screen name="Support" component={SupportPage} />
            <Stack.Screen name="SupportChat" component={SupportChatPage} />
            <Stack.Screen name="TrackOrder" component={TrackOrderPage} />
            <Stack.Screen name="Notifications" component={NotificationsPage} />
            <Stack.Screen name="Terms" component={TermsPage} />
            <Stack.Screen name="About" component={AboutPage} />
            <Stack.Screen name="Chatbot" component={ChatbotPage} />
            <Stack.Screen name="ChatRider" component={RiderChatPage} />
            <Stack.Screen name="Settings" component={SettingsPage} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordPage} />
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
import { NotificationProvider } from './context/NotificationContext';
import { MaintenanceOverlay } from './components/feature/MaintenanceOverlay';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // #region debug-point A:timed-splash-release
      fetch("http://192.168.137.166:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"user-app-startup",runId:"pre-fix",hypothesisId:"A",location:"src/App.tsx:129",msg:"[DEBUG] Timed splash released",data:{showSplashBefore:true},ts:Date.now()})}).catch(()=>{});
      // #endregion
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

  // #region debug-point B:root-app-state
  fetch("http://192.168.137.166:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"user-app-startup",runId:"pre-fix",hypothesisId:"B",location:"src/App.tsx:143",msg:"[DEBUG] Root app render",data:{showSplash,fontsLoaded},ts:Date.now()})}).catch(()=>{});
  // #endregion

  if (showSplash || !fontsLoaded) {
    return <SplashView />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <SettingsProvider>
            <AlertProvider>
              <SafeAreaProvider>
                <AppNavigator />
                <NotificationOverlay />
                <MaintenanceOverlay />
              </SafeAreaProvider>
            </AlertProvider>
          </SettingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
