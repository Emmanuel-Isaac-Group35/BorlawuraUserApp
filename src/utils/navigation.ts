import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const navigate = (name: any, params?: any, retries = 50) => {
  if (navigationRef.isReady()) {
    (navigationRef as any).navigate(name, params);
  } else if (retries > 0) {
    setTimeout(() => {
      navigate(name, params, retries - 1);
    }, 100);
  }
};

// Map web routes to React Navigation routes
export const routeMap: { [key: string]: string } = {
  '/': 'Home',
  '/home': 'Home',
  '/home/': 'Home',
  '/booking': 'Booking',
  '/orders': 'Orders',
  '/services': 'Services',
  '/profile': 'Profile',
  '/profile/about': 'About',
  '/support': 'Support',
  '/support-chat': 'SupportChat',
  '/live-support': 'SupportChat',
  '/track-order': 'TrackOrder',
  '/saved-addresses': 'SavedAddresses',
  '/profile/payment-methods': 'PaymentMethods',
  '/profile/notifications': 'Notifications',
  '/profile/terms': 'Terms',
  '/chatbot': 'Chatbot',
  '/chat-rider': 'ChatRider',
  '/rider-chat': 'ChatRider',
  '/notifications': 'Notifications',
  '/notifications-history': 'Notifications',
  '/settings': 'Settings',
};

export const navigateTo = (path: string, params?: any) => {
  const routeName = routeMap[path] || path;
  navigate(routeName, params);
};



