import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { typography } from '../../utils/typography';

export const BottomNavigation: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentPath, setCurrentPath] = React.useState('/');
  const [isNavReady, setIsNavReady] = React.useState(false);

  React.useEffect(() => {
    // Poll for readiness
    const checkReady = setInterval(() => {
      if (navigationRef.isReady()) {
        setIsNavReady(true);
        clearInterval(checkReady);
      }
    }, 100);

    const unsub = navigationRef.addListener('state', () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route) {
          const routeValues: { [key: string]: string } = {
            'Home': '/',
            'Booking': '/booking',
            'Orders': '/orders',
            'Profile': '/profile',
          };
          setCurrentPath(routeValues[route.name] || '/');
        }
      }
    });

    return () => {
      clearInterval(checkReady);
      unsub();
    };
  }, []);

  const navItems: any[] = [
    { path: '/', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
    { path: '/booking', icon: 'calendar', iconOutline: 'calendar-outline', label: 'Book' },
    { path: '/orders', icon: 'receipt', iconOutline: 'receipt-outline', label: 'Orders' },
    { path: '/profile', icon: 'person', iconOutline: 'person-outline', label: 'Profile' }
  ];

  const handleNavigate = (path: string) => {
    navigateTo(path);
  };

  const isVisible = (() => {
    if (!isNavReady) return false;
    const route = navigationRef.getCurrentRoute();
    if (!route) return false;
    const hideOn = ['Auth', 'Signup', 'OTP', 'TrackOrder', 'SupportChat', 'RiderChat', 'Chatbot'];
    return !hideOn.includes(route.name);
  })();

  if (!isVisible) return null;

  return (
    <View style={[styles.navWrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.nav}>
        <View style={styles.navGrid}>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleNavigate(item.path)}
                style={styles.navItem}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive
                ]}>
                  <Ionicons 
                    name={isActive ? item.icon : item.iconOutline} 
                    size={24} 
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
    zIndex: 40,
  },
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 15,
    width: '92%',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.5)',
  },
  navGrid: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: '#f0fdf4',
  },
  glow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#bbf7d0',
    opacity: 0.3,
    zIndex: -1,
    transform: [{ scale: 1.2 }],
  },
  label: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    marginTop: 6,
    letterSpacing: -0.2
  },
  labelActive: {
    color: '#10b981',
  },
  labelInactive: {
    color: '#64748b',
  },
});
