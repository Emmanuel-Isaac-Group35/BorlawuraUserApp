import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Image, Vibration
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { typography } from '../../../utils/typography';
import { supabase } from '../../../lib/supabase';
import { resolveRealUserId } from '../../../utils/user';

interface NotifSettings {
  orderUpdates: boolean;
  riderArrival: boolean;
  riderNearby: boolean;
  pickupConfirmed: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface AssignedRider {
  id: string;
  full_name: string;
  phone_number: string;
  avatar_url: string | null;
  rating: string;
  vehicle_number: string | null;
  is_online: boolean;
}

const DEFAULT: NotifSettings = {
  orderUpdates: true,
  riderArrival: true,
  riderNearby: true,
  pickupConfirmed: true,
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

import { useNotifications, AppNotification } from '../../../context/NotificationContext';

const NotificationsPage: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState<'inbox'>('inbox');
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [assignedRider, setAssignedRider] = useState<AssignedRider | null>(null);
  const [loadingRider, setLoadingRider] = useState(true);

  // ── Auto-mark read when opening Inbox ─────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'inbox') {
      markAllAsRead();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadPrefs = async () => {
      const uid = await resolveRealUserId(user);
      if (!uid) return;
      const { data } = await supabase.from('user_notification_prefs').select('*').eq('user_id', uid).single();
      if (data) {
        setSettings({
          orderUpdates:      data.order_updates      ?? DEFAULT.orderUpdates,
          riderArrival:      data.rider_arrival      ?? DEFAULT.riderArrival,
          riderNearby:       data.rider_nearby       ?? DEFAULT.riderNearby,
          pickupConfirmed:   data.pickup_confirmed   ?? DEFAULT.pickupConfirmed,
          pushNotifications: data.push_notifications ?? DEFAULT.pushNotifications,
          emailNotifications:data.email_notifications?? DEFAULT.emailNotifications,
          smsNotifications:  data.sms_notifications  ?? DEFAULT.smsNotifications,
          soundEnabled:      data.sound_enabled      ?? DEFAULT.soundEnabled,
          vibrationEnabled:  data.vibration_enabled  ?? DEFAULT.vibrationEnabled,
        });
      }
    };
    loadPrefs();
  }, [user]);

  useEffect(() => {
    const loadRider = async () => {
      setLoadingRider(true);
      try {
        const uid = await resolveRealUserId(user);
        if (!uid) return;
        const { data: order } = await supabase.from('orders').select('rider_id').eq('user_id', uid).in('status', ['accepted', 'in_progress', 'assigned', 'heading', 'arrived', 'active', 'confirmed']).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (order?.rider_id) {
          const { data: rider } = await supabase.from('riders').select('id, full_name, phone_number, avatar_url, rating, vehicle_number, is_online').eq('id', order.rider_id).single();
          if (rider) setAssignedRider(rider);
        }
      } catch (_) {}
      finally { setLoadingRider(false); }
    };
    loadRider();
  }, [user]);

  const handleToggle = useCallback((key: keyof NotifSettings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setIsDirty(true);
    if (key === 'vibrationEnabled' && newValue) Vibration.vibrate([0, 80, 60, 80]);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const uid = await resolveRealUserId(user);
      if (!uid) throw new Error('Not authenticated');
      const { error } = await supabase.from('user_notification_prefs').upsert({
        user_id: uid,
        order_updates:       settings.orderUpdates,
        rider_arrival:       settings.riderArrival,
        rider_nearby:        settings.riderNearby,
        pickup_confirmed:    settings.pickupConfirmed,
        push_notifications:  settings.pushNotifications,
        email_notifications: settings.emailNotifications,
        sms_notifications:   settings.smsNotifications,
        sound_enabled:       settings.soundEnabled,
        vibration_enabled:   settings.vibrationEnabled,
        updated_at:          new Date().toISOString(),
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      setIsDirty(false);
      if (settings.vibrationEnabled) Vibration.vibrate([0, 60, 40, 60]);
      Alert.alert('Configuration Saved', 'Your terminal alert preferences have been updated.');
    } catch (e: any) {
      if (e?.code === 'PGRST205' || (e?.message && e.message.includes('user_notification_prefs'))) {
        Alert.alert(
          'Database Sync Failed',
          'Could not sync preferences. The user_notification_prefs table does not exist in your Supabase database. Please run the user_notification_prefs database migration in your Supabase SQL Editor.'
        );
      } else {
        Alert.alert('Sync Failed', e.message || 'Failed to update preferences.');
      }
    } finally { setIsSaving(false); }
  };

  const groups = [
    {
      title: 'Order & Rider Updates',
      icon: 'ri-radar-line', color: '#10b981', bg: '#ecfdf5',
      items: [
        { key: 'orderUpdates',    label: 'Order Status',      desc: 'Updates on your pickups', icon: 'ri-refresh-line' },
        { key: 'riderArrival',    label: 'Rider Arrival',        desc: 'Alert when rider arrives',  icon: 'ri-map-pin-line' },
        { key: 'riderNearby',     label: 'Rider Nearby',     desc: 'Alert when rider is close',     icon: 'ri-walk-line' },
      ],
    },
    {
      title: 'Communication Channels',
      icon: 'ri-broadcast-line', color: '#3b82f6', bg: '#eff6ff',
      items: [
        { key: 'pushNotifications',  label: 'Direct Push',  desc: 'Instant alerts on this terminal', icon: 'ri-notification-3-line' },
        { key: 'emailNotifications', label: 'External Email', desc: 'Daily logs and report summaries', icon: 'ri-mail-line' },
      ],
    },
    {
      title: 'Phone Alerts',
      icon: 'ri-sound-module-line', color: '#8b5cf6', bg: '#f5f3ff',
      items: [
        { key: 'soundEnabled',     label: 'Sound',    desc: 'Play sound for alerts',      icon: 'ri-volume-up-line' },
        { key: 'vibrationEnabled', label: 'Vibration',  desc: 'Vibrate for alerts',     icon: 'ri-smartphone-line' },
      ],
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <View style={[styles.pageHeader, { marginTop: insets.top + 70 }]}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.pageTitle}>Notifications</Text>
          {activeTab === 'inbox' && notifications.some(n => !n.read) && (
             <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
               <Text style={styles.markReadText}>Mark all as read</Text>
             </TouchableOpacity>
          )}
        </View>
        
        {notifications.some(n => !n.read) && (
          <View style={styles.unreadIndicatorRow}>
            <View style={styles.tabDot} />
            <Text style={styles.unreadIndicatorText}>You have unread notifications</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inboxContent}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <TouchableOpacity key={notif.id} style={[styles.notifCard, !notif.read && styles.notifUnread]}>
                <View style={[styles.notifIconBox, { backgroundColor: notif.color + '15' }]}>
                  <RemixIcon name={notif.icon} size={20} color={notif.color} />
                </View>
                <View style={styles.notifInfo}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  <Text style={styles.notifDesc} numberOfLines={2}>{notif.desc}</Text>
                </View>
                {!notif.read && <View style={styles.unreadPulse} />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <RemixIcon name="ri-notification-off-line" size={32} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>Mission Log Empty</Text>
              <Text style={styles.emptySub}>Recent updates on your pickups will appear here.</Text>
            </View>
          )}

          {assignedRider && (
             <View style={styles.assignedSection}>
                <Text style={styles.sectionLabelText}>ACTIVE MISSION UNIT</Text>
                <View style={styles.riderCard}>
                  <View style={styles.riderAvatarWrap}>
                    {assignedRider.avatar_url
                      ? <Image source={{ uri: assignedRider.avatar_url }} style={styles.riderAvatar} />
                      : <View style={[styles.riderAvatar, styles.riderAvatarFallback]}>
                          <RemixIcon name="ri-user-3-line" size={26} color="#94a3b8" />
                        </View>}
                    <View style={[styles.onlineDot, { backgroundColor: assignedRider.is_online ? '#10b981' : '#94a3b8' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riderName}>{assignedRider.full_name}</Text>
                    <Text style={styles.riderMeta}>{assignedRider.vehicle_number || 'TRC-001'} · ⭐ {parseFloat(assignedRider.rating || '5.0').toFixed(1)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.riderActionBtn}
                    onPress={() => navigation.navigate('ChatRider', { riderId: assignedRider.id })}
                  >
                    <RemixIcon name="ri-chat-3-line" size={20} color="#10b981" />
                  </TouchableOpacity>
                </View>
             </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flex: 1 },
  
  // Header
  pageHeader: { paddingHorizontal: 24, marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 26, fontFamily: typography.bold, color: '#0f172a' },
  markReadBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  markReadText: { fontSize: 12, fontFamily: typography.bold, color: '#10b981' },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  unreadIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  unreadIndicatorText: { fontSize: 12, fontFamily: typography.medium, color: '#ef4444' },

  // Inbox
  inboxContent: { paddingHorizontal: 20 },
  notifCard: { flexDirection: 'row', gap: 16, backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', position: 'relative' },
  notifUnread: { backgroundColor: '#fdfdfd', borderColor: '#e2e8f0' },
  notifIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifInfo: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontFamily: typography.bold, color: '#0f172a' },
  notifTime: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },
  notifDesc: { fontSize: 13, fontFamily: typography.medium, color: '#64748b', lineHeight: 18 },
  unreadPulse: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },

  // Empty State
  emptyState: { paddingVertical: 80, alignItems: 'center' },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: typography.bold, color: '#475569', marginBottom: 4 },
  emptySub: { fontSize: 14, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },

  // Settings
  settingsContent: { paddingHorizontal: 20 },
  groupWrap: { marginBottom: 24 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 4 },
  sectionIconBox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sectionLabelText: { fontSize: 11, fontFamily: typography.bold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  groupCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontFamily: typography.semiBold, color: '#475569', marginBottom: 2 },
  rowDesc: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', lineHeight: 16 },
  saveBtn: { backgroundColor: '#0f172a', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 24 },
  saveBtnText: { fontSize: 15, fontFamily: typography.bold, color: '#fff' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#eff6ff', borderRadius: 16, padding: 16 },
  infoText: { flex: 1, fontSize: 13, fontFamily: typography.medium, color: '#1e40af', lineHeight: 18 },

  // Rider Card (Re-styled)
  assignedSection: { marginTop: 32 },
  riderCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0f172a', borderRadius: 20, padding: 16, marginTop: 12 },
  riderAvatarWrap: { position: 'relative' },
  riderAvatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#1e293b' },
  riderAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#0f172a' },
  riderName: { fontSize: 15, fontFamily: typography.bold, color: '#fff' },
  riderMeta: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  riderActionBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
});

export default NotificationsPage;
