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

const NotificationsPage: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [settings, setSettings] = useState<NotifSettings>(DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [assignedRider, setAssignedRider] = useState<AssignedRider | null>(null);
  const [loadingRider, setLoadingRider] = useState(true);

  // ── Load saved preferences ────────────────────────────────────────────────
  useEffect(() => {
    const loadPrefs = async () => {
      const uid = await resolveRealUserId(user);
      if (!uid) return;
      const { data } = await supabase
        .from('user_notification_prefs')
        .select('*')
        .eq('user_id', uid)
        .single();
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

  // ── Load currently assigned rider ─────────────────────────────────────────
  useEffect(() => {
    const loadRider = async () => {
      setLoadingRider(true);
      try {
        const uid = await resolveRealUserId(user);
        if (!uid) return;
        // Find the most recent active order with a rider
        const { data: order } = await supabase
          .from('orders')
          .select('rider_id')
          .eq('user_id', uid)
          .in('status', ['accepted', 'in_progress', 'assigned', 'heading', 'arrived', 'active', 'confirmed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (order?.rider_id) {
          const { data: rider } = await supabase
            .from('riders')
            .select('id, full_name, phone_number, avatar_url, rating, vehicle_number, is_online')
            .eq('id', order.rider_id)
            .single();
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

    // Provide immediate physical feedback
    if (key === 'vibrationEnabled') {
      if (newValue) {
        // Give a confirmation buzz when enabling
        Vibration.vibrate([0, 80, 60, 80]);
      }
    }
    if (key === 'soundEnabled') {
      if (newValue) {
        Alert.alert('Sound On', 'Notification sounds have been enabled.');
      } else {
        Alert.alert('Sound Off', 'Notification sounds have been muted.');
      }
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const uid = await resolveRealUserId(user);
      if (!uid) throw new Error('Not authenticated');
      await supabase.from('user_notification_prefs').upsert({
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
      setIsDirty(false);
      if (settings.vibrationEnabled) Vibration.vibrate([0, 60, 40, 60]);
      Alert.alert('Saved ✓', 'Your notification preferences have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Sections ──────────────────────────────────────────────────────────────
  const groups = [
    {
      title: 'Order & Pickup Alerts',
      icon: 'ri-truck-line',
      color: '#10b981',
      bg: '#f0fdf4',
      items: [
        { key: 'orderUpdates',    label: 'Order Status Updates',    desc: 'When your order status changes',              icon: 'ri-refresh-line' },
        { key: 'riderArrival',    label: 'Rider Arrival Alert',     desc: 'Alert when rider is at your location',        icon: 'ri-map-pin-line' },
        { key: 'riderNearby',     label: 'Rider Nearby',            desc: 'When your rider is within 500m',              icon: 'ri-walk-line' },
        { key: 'pickupConfirmed', label: 'Pickup Confirmed',        desc: 'Confirmation when rider accepts your request', icon: 'ri-checkbox-circle-line' },
      ],
    },
    {
      title: 'Notification Channels',
      icon: 'ri-notification-3-line',
      color: '#3b82f6',
      bg: '#eff6ff',
      items: [
        { key: 'pushNotifications',  label: 'Push Notifications', desc: 'Receive alerts on this device',       icon: 'ri-notification-3-line' },
        { key: 'emailNotifications', label: 'Email',              desc: 'Updates sent to your email address',  icon: 'ri-mail-line' },
        { key: 'smsNotifications',   label: 'SMS',                desc: 'Text messages to your phone number',  icon: 'ri-message-3-line' },
      ],
    },
    {
      title: 'Sound & Vibration',
      icon: 'ri-volume-up-line',
      color: '#8b5cf6',
      bg: '#f5f3ff',
      items: [
        { key: 'soundEnabled',     label: 'Notification Sound',     desc: 'Play audio for all incoming alerts',    icon: 'ri-volume-up-line' },
        { key: 'vibrationEnabled', label: 'Haptic Vibration',       desc: 'Buzz device for important alerts',      icon: 'ri-smartphone-line' },
      ],
    },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header ── */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <RemixIcon name="ri-arrow-left-line" size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>Manage how you want to be reached</Text>
          </View>
          {isDirty && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Assigned Rider Card ── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Your Current Rider</Text>
        </View>

        {loadingRider ? (
          <View style={styles.riderLoading}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.riderLoadingText}>Checking for active rider…</Text>
          </View>
        ) : assignedRider ? (
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
              <Text style={styles.riderMeta}>
                {assignedRider.vehicle_number || 'No plate'} · ⭐ {parseFloat(assignedRider.rating || '5.0').toFixed(1)}
              </Text>
              <View style={styles.riderStatusPill}>
                <View style={styles.riderStatusDot} />
                <Text style={styles.riderStatusText}>
                  {assignedRider.is_online ? 'En route to you' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.riderActions}>
              <TouchableOpacity
                style={styles.riderActionBtn}
                onPress={() => navigation.navigate('ChatRider', { riderId: assignedRider.id })}
              >
                <RemixIcon name="ri-chat-3-line" size={18} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.riderActionBtn, styles.riderCallBtn]}
                onPress={() => {
                  const { Linking } = require('react-native');
                  Linking.openURL(`tel:${assignedRider.phone_number}`);
                }}
              >
                <RemixIcon name="ri-phone-line" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noRiderCard}>
            <RemixIcon name="ri-map-pin-line" size={28} color="#94a3b8" />
            <Text style={styles.noRiderText}>No active rider assigned yet</Text>
            <Text style={styles.noRiderSub}>A rider will appear here once your pickup is accepted</Text>
          </View>
        )}

        {/* ── Notification Groups ── */}
        {groups.map((group) => (
          <View key={group.title} style={styles.groupWrap}>
            <View style={styles.sectionLabel}>
              <View style={[styles.sectionIconBox, { backgroundColor: group.bg }]}>
                <RemixIcon name={group.icon} size={14} color={group.color} />
              </View>
              <Text style={styles.sectionLabelText}>{group.title}</Text>
            </View>

            <View style={styles.groupCard}>
              {group.items.map((item, idx) => {
                const isOn = settings[item.key as keyof NotifSettings];
                return (
                  <View
                    key={item.key}
                    style={[styles.row, idx < group.items.length - 1 && styles.rowBorder]}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: isOn ? group.bg : '#f8fafc' }]}>
                      <RemixIcon name={item.icon} size={18} color={isOn ? group.color : '#94a3b8'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowLabel, isOn && { color: '#0f172a' }]}>{item.label}</Text>
                      <Text style={styles.rowDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={!!isOn}
                      onValueChange={() => handleToggle(item.key as keyof NotifSettings)}
                      trackColor={{ false: '#e2e8f0', true: group.color }}
                      thumbColor="#ffffff"
                      ios_backgroundColor="#e2e8f0"
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Info Banner ── */}
        <View style={styles.infoBanner}>
          <RemixIcon name="ri-information-line" size={16} color="#3b82f6" />
          <Text style={styles.infoText}>
            Some alerts (like Rider Arrival) are required for service delivery and cannot be permanently muted.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },

  // Header
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  pageTitle: { fontSize: 24, fontFamily: typography.bold, color: '#0f172a', letterSpacing: -0.6 },
  pageSubtitle: { fontSize: 13, fontFamily: typography.medium, color: '#64748b', marginTop: 2 },
  saveBtn: {
    backgroundColor: '#10b981', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#fff' },

  // Rider card
  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#0f172a', borderRadius: 24, padding: 16, marginBottom: 28,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  riderAvatarWrap: { position: 'relative' },
  riderAvatar: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#1e293b' },
  riderAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0f172a',
  },
  riderName: { fontSize: 15, fontFamily: typography.bold, color: '#fff', marginBottom: 3 },
  riderMeta: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginBottom: 6 },
  riderStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  riderStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  riderStatusText: { fontSize: 11, fontFamily: typography.bold, color: '#34d399' },
  riderActions: { flexDirection: 'row', gap: 10 },
  riderActionBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  riderCallBtn: { backgroundColor: '#10b981' },

  noRiderCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 28,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  noRiderText: { fontSize: 15, fontFamily: typography.bold, color: '#475569', marginTop: 4 },
  noRiderSub: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  riderLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, backgroundColor: '#fff', borderRadius: 20, marginBottom: 28 },
  riderLoadingText: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8' },

  // Section label
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconBox: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sectionLabelText: { fontSize: 12, fontFamily: typography.bold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Group card
  groupWrap: { marginBottom: 24 },
  groupCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontFamily: typography.semiBold, color: '#475569', marginBottom: 2 },
  rowDesc: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', lineHeight: 16 },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: typography.medium, color: '#1e40af', lineHeight: 20 },
});
