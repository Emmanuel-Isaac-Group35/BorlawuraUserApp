import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import SplashView from './components/SplashView';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import HomePage from './pages/home/page';
import AuthPage from './pages/auth/page';
import SignupPage from './pages/auth/signup';
import OTPPage from './pages/auth/otp';
import BookingPage from './pages/booking/page';
import OrdersPage from './pages/orders/page';
import ServicesPage from './pages/services/page';
import ProfilePage from './pages/profile/page';
import SupportPage from './pages/support/page';
import SupportChatPage from './pages/support/chat';
import TrackOrderPage from './pages/track-order/page';
import PaymentMethodsPage from './pages/profile/payment-methods/page';
import NotificationsPage from './pages/profile/notifications/page';
import TermsPage from './pages/profile/terms/page';
import AboutPage from './pages/profile/about/page';
import NotFound from './pages/NotFound';
import ChatbotPage from './pages/chatbot/page';
import RiderChatPage from './pages/chat-rider/page';

// Import navigation utility
import { navigationRef } from './utils/navigation';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoggedIn, isSuspended, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? (isSuspended ? "Auth" : "Home") : "Auth"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        {!isLoggedIn || isSuspended ? (
          <>
            <Stack.Screen name="Auth" component={AuthPage} />
            <Stack.Screen name="Signup" component={SignupPage} />
            <Stack.Screen name="OTP" component={OTPPage} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomePage} options={{ animation: 'none' }} />
            <Stack.Screen name="Booking" component={BookingPage} options={{ animation: 'none' }} />
            <Stack.Screen name="Orders" component={OrdersPage} options={{ animation: 'none' }} />
            <Stack.Screen name="Services" component={ServicesPage} options={{ animation: 'none' }} />
            <Stack.Screen name="Profile" component={ProfilePage} options={{ animation: 'none' }} />
            <Stack.Screen name="Support" component={SupportPage} />
            <Stack.Screen name="SupportChat" component={SupportChatPage} />
            <Stack.Screen name="TrackOrder" component={TrackOrderPage} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsPage} />
            <Stack.Screen name="Notifications" component={NotificationsPage} />
            <Stack.Screen name="Terms" component={TermsPage} />
            <Stack.Screen name="About" component={AboutPage} />
            <Stack.Screen name="Chatbot" component={ChatbotPage} />
            <Stack.Screen name="RiderChat" component={RiderChatPage} />
          </>
        )}
        <Stack.Screen name="NotFound" component={NotFound} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500); // reduced from 5 seconds to 1.5s to speed up app loading

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashView />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
