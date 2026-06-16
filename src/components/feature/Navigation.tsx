import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const Navigation: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();

  // Pulse animation when new notifications arrive
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.2,  duration: 140, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 140, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount]);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  
  const formatRouteName = (name: string) => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  };
  
  const isHome = route.name === 'Home';
  const headerTitle = isHome ? (settings?.mobileApp?.headerTitle || 'Borlawura') : formatRouteName(route.name);
  const headerTagline = isHome ? (settings?.mobileApp?.headerTagline || 'Cleaner City. Simple.') : null;
  
  const isDark = ['ChatRider', 'ActiveTrip', 'FindingRider'].includes(route.name);

  return (
    <View style={styles.navWrapper}>
      <View style={[styles.nav, isDark && styles.navDark, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <View style={styles.navContent}>
          <View style={styles.navLeft}>
            {!isHome ? (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={[styles.backBtnHeader, isDark && styles.backBtnHeaderDark]}
                activeOpacity={0.7}
              >
                <RemixIcon name="ri-arrow-left-s-line" size={24} color={isDark ? "#ffffff" : "#0f172a"} />
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
              <Text style={[styles.logoText, isDark && styles.logoTextDark]}>{headerTitle}</Text>
              {headerTagline && (
                <View style={styles.taglineBox}>
                  <Text style={styles.tagline}>{headerTagline}</Text>
                </View>
              )}
            </View>
          </View>
          
          {isHome && (
            <View style={styles.rightActions}>
              {/* ── Notification Bell ── */}
              <TouchableOpacity
                style={[styles.notifBtn, isDark && styles.notifBtnDark]}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.75}
              >
                <RemixIcon
                  name={unreadCount > 0 ? 'ri-notification-3-fill' : 'ri-notification-3-line'}
                  size={20}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
                {unreadCount > 0 && (
                  <Animated.View style={[styles.countBadge, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.countBadgeText}>{badgeLabel}</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>

              {/* ── Profile pill ── */}
              <TouchableOpacity
                style={[styles.profilePill, isDark && styles.profilePillDark]}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.7}
              >
                <View style={styles.profilePillAvatar}>
                  {user?.avatar_url ? (
                    <Image
                      source={{ uri: `${user.avatar_url}${user.avatar_url.includes('?') ? '&' : '?'}t=${new Date().getTime()}` }}
                      style={styles.profileAvatarImg}
                    />
                  ) : (
                    <RemixIcon name="ri-user-3-fill" size={16} color="#0d9488" />
                  )}
                </View>
                <Text style={[styles.profilePillText, isDark && styles.profilePillTextDark]}>Profile</Text>
                <RemixIcon name="ri-arrow-right-s-line" size={16} color={isDark ? 'rgba(255,255,255,0.7)' : '#0d9488'} />
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleBox: {
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  taglineBox: {
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(5, 150, 105, 0.1)',
  },
  tagline: {
    fontSize: 8,
    fontFamily: typography.bold,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#d1fae5',
  },
  profilePillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  profilePillAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profilePillText: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: '#065f46',
    marginRight: 2,
  },
  profilePillTextDark: {
    color: '#ffffff',
  },
  backBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadBadge: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  navDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnHeaderDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoTextDark: {
    color: '#ffffff',
  },

  // Right-side action group
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Notification bell button
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  notifBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Numeric count badge
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  countBadgeText: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: '#ffffff',
    lineHeight: 11,
  },
});
