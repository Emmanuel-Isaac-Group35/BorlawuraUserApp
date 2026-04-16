import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { typography } from '../../utils/typography';

export const BottomNavigation: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentPath, setCurrentPath] = useState('/');
  const [isNavReady, setIsNavReady] = useState(false);

  useEffect(() => {
    // Immediate check
    if (navigationRef.isReady()) {
      setIsNavReady(true);
    }

    // Polling as a fallback for initial state
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        setIsNavReady(true);
        const route = navigationRef.getCurrentRoute();
        if (route) updatePath(route.name);
        clearInterval(interval);
      }
    }, 100);

    const unsub = navigationRef.addListener('state', () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route) updatePath(route.name);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const updatePath = (routeName: string) => {
    const routeValues: { [key: string]: string } = {
      'Home': '/',
      'Booking': '/booking',
      'Orders': '/orders',
      'Profile': '/profile',
    };
    setCurrentPath(routeValues[routeName] || '/');
  };

  const navItems = [
    { path: '/', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { path: '/booking', icon: 'calendar', iconOutline: 'calendar-outline', label: 'Book' },
    { path: '/orders', icon: 'receipt', iconOutline: 'receipt-outline', label: 'Orders' },
    { path: '/profile', icon: 'person', iconOutline: 'person-outline', label: 'Profile' }
  ];

  const isVisible = (() => {
    if (!isNavReady) return false;
    const route = navigationRef.getCurrentRoute();
    if (!route) return true; // Default to visible if we're not sure
    
    // Explicitly hide on screens that occupy the whole bottom area
    const hideOn = [
      'Auth', 'Signup', 'OTP', 'ForgotPassword', 
      'TrackOrder', 'SupportChat', 'RiderChat', 'Chatbot',
      'CompleteProfile'
    ];
    return !hideOn.includes(route.name);
  })();

  if (!isVisible) return null;

  return (
    <View style={[styles.navWrapper, { bottom: Math.max(insets.bottom, 20) }]}>
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
                <View style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive
                ]}>
                  <Ionicons 
                    name={isActive ? item.icon : item.iconOutline} 
                    size={22} 
                    color={isActive ? '#10b981' : '#64748b'} 
                  />
                  {isActive && <View style={styles.glow} />}
                </View>
                <Text style={[
                  styles.label,
                  isActive ? styles.labelActive : styles.labelInactive
                ]}>
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
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999, // Max priority
    elevation: 20, // Critical for Android visibility
  },
  nav: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  navGrid: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    opacity: 0.1,
    zIndex: -1,
    transform: [{ scale: 1.5 }],
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
