import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { typography } from '../../utils/typography';

export const BottomNavigation: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentPath, setCurrentPath] = useState('/');
  const [isNavReady, setIsNavReady] = useState(false);

  useEffect(() => {
    const checkReady = () => {
      if (navigationRef.isReady()) {
        setIsNavReady(true);
        const route = navigationRef.getCurrentRoute();
        if (route) updatePath(route.name);
        return true;
      }
      return false;
    };

    if (!checkReady()) {
      const interval = setInterval(() => {
        if (checkReady()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }

    const unsub = navigationRef.addListener('state', () => {
      const route = navigationRef.getCurrentRoute();
      if (route) updatePath(route.name);
    });

    return unsub;
  }, []);

  const updatePath = (routeName: string) => {
    const routeValues: { [key: string]: string } = {
      'Home': '/',
      'Booking': '/booking',
      'Orders': '/orders',
      'Profile': '/profile',
      'SupportChat': '/support-chat',
      'RiderChat': '/rider-chat',
      'Support': '/support',
      'TrackOrder': '/track-order',
      'Chatbot': '/chatbot',
    };
    setCurrentPath(routeValues[routeName] || '/');
  };

  const navItems = [
    { path: '/', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { path: '/booking', icon: 'add-circle', iconOutline: 'add-circle-outline', label: 'Book' },
    { path: '/orders', icon: 'receipt', iconOutline: 'receipt-outline', label: 'History' },
    { path: '/profile', icon: 'person', iconOutline: 'person-outline', label: 'Profile' }
  ];

  const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
  const hideOn = [
    'Auth', 'Signup', 'OTP', 'ForgotPassword', 'ResetPassword',
    'TrackOrder', 'SupportChat', 'RiderChat', 'Chatbot', 'support-chat'
  ];
  const isVisible = isNavReady && route && !hideOn.includes(route.name);

  if (!isVisible) return null;

  return (
    <View style={[styles.navWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.nav}>
        <View style={styles.navGrid}>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => navigateTo(item.path)}
                style={styles.navItem}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                  <Ionicons 
                    name={isActive ? (item.icon as any) : (item.iconOutline as any)} 
                    size={25} 
                    color={isActive ? '#10b981' : '#64748b'} 
                  />
                  {isActive && <View style={styles.glow} />}
                </View>
                <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    zIndex: 9999,
    paddingTop: 8,
  },
  nav: {
    paddingHorizontal: 20,
  },
  navGrid: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: '#f0fdf4',
  },
  glow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    opacity: 0.1,
    zIndex: -1,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.semiBold,
    marginTop: 4,
  },
  labelActive: {
    color: '#10b981',
  },
  labelInactive: {
    color: '#64748b',
  },
});
