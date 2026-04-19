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
  
  const formatRouteName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  };
  
  const isHome = route.name === 'Home';
  const headerTitle = isHome ? (settings?.mobileApp?.headerTitle || 'Borla Wura') : formatRouteName(route.name);
  const headerTagline = isHome ? (settings?.mobileApp?.headerTagline || 'Cleaner City. Simple.') : null;

  return (
    <View style={styles.navWrapper}>
      <View style={[styles.nav, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <View style={styles.navContent}>
          <View style={styles.navLeft}>
            {!isHome ? (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backBtnHeader}
                activeOpacity={0.7}
              >
                <RemixIcon name="ri-arrow-left-s-line" size={24} color="#0f172a" />
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
            <View style={styles.titleBox}>
              <Text style={styles.logoText}>{headerTitle}</Text>
              {headerTagline && (
                <View style={styles.taglineBox}>
                  <Text style={styles.tagline}>{headerTagline}</Text>
                </View>
              )}
            </View>
          </View>
          
          {isHome && (
            <TouchableOpacity 
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <RemixIcon name="ri-notification-3-line" size={22} color="#0f172a" />
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 8,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleBox: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  taglineBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  tagline: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  backBtnHeader: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
