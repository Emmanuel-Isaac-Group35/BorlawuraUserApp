import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';
import { useSettings } from '../../context/SettingsContext';

export const Navigation: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  
  const isHome = route.name === 'Home';
  const headerTitle = isHome ? (settings?.mobileApp?.headerTitle || 'Borla Wura') : route.name;
  const headerTagline = isHome ? (settings?.mobileApp?.headerTagline || 'Eco-friendly Pickups') : null;

  return (
    <View style={styles.navWrapper}>
      <View style={[styles.nav, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
        <View style={styles.navContent}>
          <View style={styles.navLeft}>
            {!isHome ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHeader}>
                <RemixIcon name="ri-arrow-left-s-line" size={24} color="#1f2937" />
              </TouchableOpacity>
            ) : (
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../../assets/Borla Wura Logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <View>
              <Text style={styles.logoText}>{headerTitle}</Text>
              {headerTagline && <Text style={styles.tagline}>{headerTagline}</Text>}
            </View>
          </View>
          
          {isHome && (
            <TouchableOpacity 
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <RemixIcon name="ri-notification-3-line" size={22} color="#1f2937" />
              <View style={styles.unreadBadge} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  tagline: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#10b981',
    marginTop: -2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  backBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
});
