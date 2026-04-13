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
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        <View style={styles.navGrid}>
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleNavigate(item.path)}
                style={styles.navItem}
                activeOpacity={0.85}
              >
                <View style={styles.iconContainer}>
                  <RemixIcon 
                    name={item.icon} 
                    size={28} 
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
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    zIndex: 40,
  },
  nav: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    width: '94%',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navGrid: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    borderRadius: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    marginTop: 2,
  },
  labelActive: {
    color: '#10b981',
  },
  labelInactive: {
    color: '#9ca3af',
  },
});
