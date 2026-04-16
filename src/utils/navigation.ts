import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export const navigate = (name: string, params?: any) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
};

// Map web routes to React Navigation routes
export const routeMap: { [key: string]: string } = {
  '/': 'Home',
  '/booking': 'Booking',
  '/orders': 'Orders',
  '/services': 'Services',
  '/profile': 'Profile',
  '/support': 'Support',
  '/support-chat': 'SupportChat',
  '/live-support': 'SupportChat',
  '/track-order': 'TrackOrder',
  '/profile/payment-methods': 'PaymentMethods',
  '/profile/notifications': 'Notifications',
  '/profile/terms': 'Terms',
  '/profile/about': 'About',
  '/chatbot': 'Chatbot',
  '/chat-rider': 'RiderChat',
};

export const navigateTo = (path: string, params?: any) => {
  const routeName = routeMap[path] || path;
  navigate(routeName, params);
};



