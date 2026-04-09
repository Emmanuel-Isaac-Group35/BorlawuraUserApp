import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

export const BottomNavigation: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    { path: '/', icon: 'ri-home-5-line', label: 'Home' },
    { path: '/booking', icon: 'ri-calendar-check-line', label: 'Book' },
    { path: '/orders', icon: 'ri-file-list-3-line', label: 'Orders' },
    { path: '/profile', icon: 'ri-user-3-line', label: 'Profile' }
  ];

  const handleNavigate = (path: string) => {
    navigateTo(path);
  };

  const getRouteName = () => {
    const routeName = route.name;
    const routeMap: { [key: string]: string } = {
      'Home': '/',
      'Booking': '/booking',
      'Orders': '/orders',
      'Profile': '/profile',
    };
    return routeMap[routeName] || '/';
  };

  const currentPath = getRouteName();

  return (
    <View style={styles.nav}>
      <View style={styles.navGrid}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => handleNavigate(item.path)}
              style={styles.navItem}
            >
              <View style={styles.iconContainer}>
                <RemixIcon 
                  name={item.icon} 
                  size={24} 
                  color={isActive ? '#10b981' : '#9ca3af'} 
                />
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
  );
};

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    zIndex: 40,
    height: 64,
  },
  navGrid: {
    flexDirection: 'row',
    height: '100%',
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  labelActive: {
    color: '#10b981',
  },
  labelInactive: {
    color: '#9ca3af',
  },
});
