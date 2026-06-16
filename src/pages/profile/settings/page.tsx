import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';
import { navigateTo } from '../../../utils/navigation';
import { useAuth } from '../../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../lib/supabase';
import { resolveRealUserId } from '../../../utils/user';

export const SettingsPage: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Local settings states (can be backed by state/storage)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load pushEnabled from AsyncStorage and Supabase on mount
  useEffect(() => {
    if (loaded) return;
    (async () => {
      try {
        const localVal = await AsyncStorage.getItem('pushEnabled');
        if (localVal !== null) {
          setPushEnabled(localVal === 'true');
        }

        const uid = await resolveRealUserId(user);
        if (uid) {
          const { data } = await supabase
            .from('user_notification_prefs')
            .select('push_notifications')
            .eq('user_id', uid)
            .maybeSingle();
          if (data && data.push_notifications !== undefined) {
            setPushEnabled(data.push_notifications);
            await AsyncStorage.setItem('pushEnabled', data.push_notifications ? 'true' : 'false');
          }
          setLoaded(true);
        }
      } catch (e) {
        // fallback
      }
    })();
  }, [user, loaded]);

  // Save pushEnabled to AsyncStorage and Supabase when changed
  const handlePushToggle = async (value: boolean) => {
    const oldValue = pushEnabled;
    setPushEnabled(value);
    try {
      await AsyncStorage.setItem('pushEnabled', value ? 'true' : 'false');
      const uid = await resolveRealUserId(user);
      if (uid) {
        const { error } = await supabase.from('user_notification_prefs').upsert({
          user_id: uid,
          push_notifications: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        if (error) throw error;
      }
    } catch (e: any) {
      if (e?.code === 'PGRST205' || (e?.message && e.message.includes('user_notification_prefs'))) {
        Alert.alert(
          'Database Sync Note',
          'Your preference is saved locally, but could not sync to the database. Please ensure you run the user_notification_prefs database migration in your Supabase SQL Editor.'
        );
      } else {
        setPushEnabled(oldValue);
        await AsyncStorage.setItem('pushEnabled', oldValue ? 'true' : 'false');
        Alert.alert('Sync Failed', 'Could not update notification preferences. Please try again.');
      }
    }
  };



  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Branded Header Card */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#10b981', '#065f46', '#022c22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RemixIcon name="ri-arrow-left-s-line" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>System Settings</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile overview mini card */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigateTo('/profile')}
          activeOpacity={0.9}
        >
          <View style={styles.profileAvatarBox}>
            <RemixIcon name="ri-user-settings-fill" size={24} color="#0d9488" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.full_name || 'Borla User'}</Text>
            <Text style={styles.profileSub}>{user?.email || 'Active Account'}</Text>
          </View>
          <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Section: Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.settingsCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-notification-3-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowDesc}>Receive live alerts for logistics updates</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Section: Account & Security */}
        <Text style={styles.sectionLabel}>Account & Security</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('ResetPassword', { fromSettings: true })} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-shield-user-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Change Password</Text>
              <Text style={styles.rowDesc}>Update your account security credentials</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('/saved-addresses')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-map-pin-user-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Saved Addresses</Text>
              <Text style={styles.rowDesc}>Manage locations for quick pickups</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('/profile/payment-methods')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-wallet-3-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Payment Methods</Text>
              <Text style={styles.rowDesc}>Manage your mobile money accounts</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section: App & Information */}
        <Text style={styles.sectionLabel}>App & Information</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('/profile/about')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-information-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>About BorlaWura</Text>
              <Text style={styles.rowDesc}>Company info, mission, and app version</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('/profile/terms')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-file-shield-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Terms & Privacy Policy</Text>
              <Text style={styles.rowDesc}>Legal agreements and data protection policies</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={() => navigateTo('/support')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}> 
              <RemixIcon name="ri-customer-service-2-fill" size={18} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Help & Support</Text>
              <Text style={styles.rowDesc}>Contact dispatch or read helpful FAQ articles</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={{ marginTop: 32, gap: 12 }}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <RemixIcon name="ri-logout-box-r-line" size={18} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Sign Out Current Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { overflow: 'hidden' },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  headerTitle: { fontSize: 18, fontFamily: typography.bold, color: '#ffffff', letterSpacing: 0.5 },
  scrollView: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  
  // Profile bar
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  profileAvatarBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  profileName: { fontSize: 16, fontFamily: typography.bold, color: '#0f172a' },
  profileSub: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },

  // Cards
  sectionLabel: { fontSize: 11, fontFamily: typography.bold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontFamily: typography.semiBold, color: '#1e293b' },
  rowDesc: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2, lineHeight: 16 },

  // Buttons
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    backgroundColor: '#fff',
  },
  logoutBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#ef4444' },

});

export default SettingsPage;
