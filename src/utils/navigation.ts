import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';

export const navigationRef = createRef<NavigationContainerRef<any>>();

export const navigate = (name: string, params?: any) => {
  navigationRef.current?.navigate(name as never, params as never);
};

// Map web routes to React Navigation routes
export const routeMap: { [key: string]: string } = {
  '/': 'Home',
  '/booking': 'Booking',
  '/orders': 'Orders',
  '/services': 'Services',
  '/profile': 'Profile',
  '/support': 'Support',
  '/track-order': 'TrackOrder',
  '/profile/payment-methods': 'PaymentMethods',
  '/profile/notifications': 'Notifications',
  '/profile/referral': 'Referral',
  '/profile/terms': 'Terms',
  '/profile/about': 'About',
};

export const navigateTo = (path: string, params?: any) => {
  const routeName = routeMap[path] || path;
  navigate(routeName, params);
};



