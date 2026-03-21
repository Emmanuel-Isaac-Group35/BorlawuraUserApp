import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';

export const navigationRef = createRef<NavigationContainerRef<any>>();

export const navigate = (name: string, params?: any) => {
  // @ts-ignore
  navigationRef.current?.navigate(name, params);
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
  '/profile/referral': 'Referral',
  '/profile/terms': 'Terms',
  '/profile/about': 'About',
  '/chatbot': 'Chatbot',
  '/chat-rider': 'RiderChat',
};

export const navigateTo = (path: string, params?: any) => {
  const routeName = routeMap[path] || path;
  navigate(routeName, params);
};



