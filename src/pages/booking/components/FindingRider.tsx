import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Image, ActivityIndicator, Easing, ScrollView, useWindowDimensions,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigatrMap } from '../../../components/feature/NavigatrMap';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';
import { supabase } from '../../../lib/supabase';
import { sendLocalNotification } from '../../../utils/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Rider {
  id: string;
  name: string;
  rating: number;
  phone: string;
  photo: string;
  distance?: string;
  lat?: number;
  lng?: number;
}

interface FindingRiderProps {
  userLat: number | null;
  userLng: number | null;
  orderId?: string;
  selectedRiderId?: string | null;
  onRiderFound: (rider: any) => void;
  onCancel: () => void;
}

const ACCEPTED_STATUSES = ['accepted', 'assigned', 'confirmed', 'active', 'in_progress', 'heading', 'arrived', 'completed'];

const STATUS_LABEL: Record<string, string> = {
  searching:  'Looking for a rider…',
  connecting: 'Connecting to your rider…',
  waiting:    'Waiting for confirmation…',
  found:      'Rider on the way!',
};

const STATUS_SUB: Record<string, string> = {
  searching:  'We\'re finding the nearest available rider for your waste pickup.',
  connecting: 'Hang tight — we\'re confirming your rider\'s availability.',
  waiting:    'Your request has been sent. The rider is reviewing your pickup details.',
  found:      '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pulse Ring component — one animated concentric ring
// ─────────────────────────────────────────────────────────────────────────────

const PulseRing: React.FC<{ delay: number; size: number; color: string }> = ({ delay, size, color }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Elapsed timer hook
// ─────────────────────────────────────────────────────────────────────────────

const useElapsedTime = (running: boolean) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const FindingRider: React.FC<FindingRiderProps> = ({
  userLat, userLng, orderId, selectedRiderId, onRiderFound, onCancel,
}) => {
  const { user } = useAuth();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const isSmall  = H < 700;
  const isMed    = H < 812;
  const PAD      = W * 0.06;
  const SONAR    = isSmall ? 110 : Math.min(200, Math.max(120, W * 0.38));

  const [status, setStatus] = useState<'searching' | 'connecting' | 'waiting' | 'found'>(
    selectedRiderId ? 'connecting' : 'searching'
  );
  const [localRider, setLocalRider] = useState<Rider | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Cancel reason modal ───────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const cancelSheetAnim = useRef(new Animated.Value(0)).current;

  const CANCEL_REASONS = [
    { id: 'wait_too_long',   icon: 'ri-time-line',            label: 'Wait is too long' },
    { id: 'wrong_address',   icon: 'ri-map-pin-line',         label: 'I entered the wrong address' },
    { id: 'change_mind',     icon: 'ri-mind-map',             label: 'I changed my mind' },
    { id: 'order_mistake',   icon: 'ri-edit-line',            label: 'Made an error in my order' },
    { id: 'found_another',   icon: 'ri-car-line',             label: 'Found another service' },
    { id: 'other',           icon: 'ri-question-line',        label: 'Other reason' },
  ];

  const openCancelModal = () => {
    setSelectedReason(null);
    setCustomReason('');
    setShowCancelModal(true);
    Animated.spring(cancelSheetAnim, { toValue: 1, tension: 65, friction: 13, useNativeDriver: true }).start();
  };

  const closeCancelModal = () => {
    Animated.timing(cancelSheetAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
      setShowCancelModal(false);
    });
  };
  // Guard: prevent onRiderFound from being called more than once
  const riderFoundRef = useRef(false);

  // Slide-up animation for the sheet
  const sheetAnim = useRef(new Animated.Value(0)).current;
  // Success pop-in
  const successAnim = useRef(new Animated.Value(0.75)).current;
  // Rider card slide-in
  const cardAnim = useRef(new Animated.Value(40)).current;

  const elapsed = useElapsedTime(status !== 'found');

  // ── GPS acquisition ───────────────────────────────────────────────────────
  const [gpsLat, setGpsLat] = useState<number>(userLat || 5.6037);
  const [gpsLng, setGpsLng] = useState<number>(userLng || -0.1870);
  const [gpsReady, setGpsReady] = useState<boolean>(!!userLat && !!userLng);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (userLat && userLng) {
      setGpsLat(userLat); setGpsLng(userLng); setGpsReady(true); return;
    }
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { setGpsReady(true); return; }
      try {
        const coarse = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setGpsLat(coarse.coords.latitude);
        setGpsLng(coarse.coords.longitude);
        setGpsReady(true);
        locationSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 3, timeInterval: 3000 },
          loc => { setGpsLat(loc.coords.latitude); setGpsLng(loc.coords.longitude); }
        );
      } catch { setGpsReady(true); }
    })();
    return () => { locationSub.current?.remove(); };
  }, [userLat, userLng]);

  const lat = gpsLat;
  const lng = gpsLng;

  // ── Online riders for map ─────────────────────────────────────────────────
  const [onlineRiders, setOnlineRiders] = useState<{ id: string; lat: number; lng: number }[]>([]);
  useEffect(() => {
    const fetchOnlineRiders = async () => {
      const { data } = await supabase.from('riders').select('id, latitude, longitude').eq('is_online', true).limit(8);
      if (data) {
        setOnlineRiders(
          data
            .map(r => ({
              id: r.id,
              lat: parseFloat(r.latitude),
              lng: parseFloat(r.longitude),
            }))
            .filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))
        );
      }
    };

    fetchOnlineRiders();
    const ridersChannel = supabase
      .channel('finding-rider-map-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, () => {
        fetchOnlineRiders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ridersChannel);
    };
  }, []);

  // ── Mount animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(sheetAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
  }, []);

  // ── Found animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'found') {
      Animated.parallel([
        Animated.spring(successAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      ]).start();
    }
  }, [status]);

  // ── Order watcher ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    const fetchRider = async (riderId: string) => {
      const { data: rd } = await supabase.from('riders').select('*').eq('id', riderId).single();
      if (!rd) return null;
      return {
        id: rd.id, name: rd.full_name || 'BorlaWura Rider',
        rating: parseFloat(rd.rating || '4.8'),
        phone: rd.phone_number || '',
        photo: rd.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        distance: 'Nearby', lat: rd.latitude, lng: rd.longitude,
      } as Rider;
    };

    const triggerRiderFound = (rider: Rider, delay: number) => {
      if (riderFoundRef.current) return; // already triggered
      riderFoundRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLocalRider(rider);
      setStatus('found');
      setTimeout(() => onRiderFound(rider), delay);
    };

    const checkStatus = async () => {
      if (riderFoundRef.current) return; // already found, stop polling
      const { data: order } = await supabase.from('orders').select('status, rider_id').eq('id', orderId).single();
      if (order?.rider_id && ACCEPTED_STATUSES.includes(order.status)) {
        const rider = await fetchRider(order.rider_id);
        if (rider) triggerRiderFound(rider, 1500);
      }
    };

    checkStatus();
    const heartbeat = setInterval(checkStatus, 5000);

    const channel = supabase.channel(`order-sync-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        async (payload: any) => {
          if (riderFoundRef.current) return;
          if (!payload.new.rider_id) return;
          const rider = await fetchRider(payload.new.rider_id);
          if (!rider) return;
          if (ACCEPTED_STATUSES.includes(payload.new.status)) {
            sendLocalNotification('Rider Assigned!', `${rider.name} is on the way to collect your waste.`, { orderId });
            triggerRiderFound(rider, 2000);
          } else {
            setLocalRider(rider);
            setStatus('waiting');
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); clearInterval(heartbeat); };
  }, [orderId]);

  // ─────────────────────────────────────────────────────────────────────────
  const sheetY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  const handleCancel = () => {
    openCancelModal();
  };

  const confirmCancel = async () => {
    const reason = selectedReason === 'other'
      ? (customReason.trim() || 'Other')
      : (CANCEL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason || 'No reason given');

    closeCancelModal();
    setIsCancelling(true);
    if (orderId) {
      await supabase.from('orders').update({
        status: 'cancelled',
        sub_status: 'user_cancelled',
        cancel_reason: reason,
      }).eq('id', orderId);
    }
    onCancel();
  };

  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <View style={[styles.mapWrap, { flex: isSmall ? 3 : 4 }]}>
        <NavigatrMap
          style={styles.map}
          centerLat={lat}
          centerLng={lng}
          zoom={15}
          variant="light"
          interactive={false}
          fitToMarkers={onlineRiders.length > 0}
          markers={[
            { lat, lng, type: 'user', label: user?.full_name || 'You' },
            ...onlineRiders.filter(r => r.lat && r.lng).map(r => ({
              lat: r.lat, lng: r.lng, type: 'rider' as const, label: 'Rider',
            })),
          ]}
          showRadar={false}
          radarTitle="Finding riders"
          radarSubtitle={`${onlineRiders.length} rider${onlineRiders.length !== 1 ? 's' : ''} nearby`}
          telemetry={status === 'found' ? { distance: '< 1 km', duration: '~3 min' } : undefined}
        />

        {/* Top map badge */}
        <View style={[styles.mapBadgeWrap, { top: (isSmall ? 60 : 100) + insets.top, paddingHorizontal: PAD }]}>
          {!gpsReady ? (
            <View style={styles.mapBadge}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={[styles.mapBadgeText, { fontSize: isSmall ? 12 : 13 }]}>Getting your location…</Text>
            </View>
          ) : status === 'found' ? (
            <View style={[styles.mapBadge, styles.mapBadgeSuccess]}>
              <RemixIcon name="ri-checkbox-circle-fill" size={14} color="#10b981" />
              <Text style={[styles.mapBadgeText, { color: '#10b981', fontSize: isSmall ? 12 : 13 }]}>Rider assigned!</Text>
            </View>
          ) : (
            <View style={styles.mapBadge}>
              <View style={styles.liveDot} />
              <Text style={[styles.mapBadgeText, { fontSize: isSmall ? 12 : 13 }]}>{STATUS_LABEL[status]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Animated bottom sheet ── */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }], flex: isSmall ? 5 : 6 }]}>
        <View style={styles.sheetHeader}>
          <View style={styles.dragHandle} />
        </View>
        <ScrollView
          style={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[styles.sheetScroll, { paddingBottom: (isSmall ? 24 : 36) + insets.bottom, paddingHorizontal: PAD }]}
          keyboardShouldPersistTaps="handled"
        >
        {status === 'found' ? (
          /* ── FOUND STATE ───────────────────────────────────────────── */
          <Animated.View style={[styles.foundBox, { transform: [{ scale: successAnim }] }]}>
            {/* Green checkmark */}
            <View style={[styles.successRing, { width: isSmall ? 72 : 84, height: isSmall ? 72 : 84, borderRadius: isSmall ? 36 : 42, marginBottom: isSmall ? 12 : 16 }]}>
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={[styles.successCircle, { width: isSmall ? 52 : 62, height: isSmall ? 52 : 62, borderRadius: isSmall ? 26 : 31 }]}
              >
                <RemixIcon name="ri-check-line" size={32} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={[styles.foundTitle, { fontSize: isSmall ? 17 : 20 }]}>Your rider is on the way!</Text>
            <Text style={[styles.foundSub, { fontSize: isSmall ? 12 : 13, marginBottom: isSmall ? 14 : 18 }]}>
              {localRider?.name} will arrive at your pickup location shortly.
            </Text>

            {/* Rider info card */}
            <Animated.View style={[styles.riderCard, { transform: [{ translateY: cardAnim }], paddingVertical: isSmall ? 10 : 14, marginBottom: isSmall ? 14 : 18 }]}>
              <Image
                source={{ uri: localRider?.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                style={[styles.riderPhoto, { width: isSmall ? 44 : 52, height: isSmall ? 44 : 52, borderRadius: isSmall ? 14 : 16 }]}
              />
              <View style={styles.riderMeta}>
                <Text style={[styles.riderName, { fontSize: isSmall ? 14 : 16 }]} numberOfLines={1}>{localRider?.name || 'BorlaWura Rider'}</Text>
                <View style={styles.ratingRow}>
                  <RemixIcon name="ri-star-fill" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{localRider?.rating?.toFixed(1) || '5.0'}</Text>
                  <Text style={styles.ratingDivider}>·</Text>
                  <RemixIcon name="ri-shield-check-fill" size={12} color="#10b981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.nearbyPill}>
                <Text style={styles.nearbyText}>Nearby</Text>
              </View>
            </Animated.View>

            <TouchableOpacity
              onPress={() => {
                if (riderFoundRef.current && localRider) {
                  onRiderFound(localRider);
                } else if (localRider) {
                  riderFoundRef.current = true;
                  onRiderFound(localRider);
                }
              }}
              style={styles.trackBtn}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.trackBtnInner, { paddingVertical: isSmall ? 13 : 16 }]}>
                <RemixIcon name="ri-moped-fill" size={18} color="#fff" />
                <Text style={[styles.trackBtnText, { fontSize: isSmall ? 14 : 15 }]}>Track your pickup</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        ) : (
          /* ── SEARCHING STATE ───────────────────────────────────────── */
          <View style={styles.searchBox}>
            {/* Sonar pulse rings — sizes are responsive */}
            <View style={[styles.sonarWrap, { width: SONAR, height: SONAR, marginBottom: isSmall ? 10 : 14, marginTop: isSmall ? 4 : 8 }]}>
              <PulseRing size={SONAR}         color="#10b981" delay={0} />
              <PulseRing size={SONAR * 0.75}  color="#3b82f6" delay={500} />
              <PulseRing size={SONAR * 0.5}   color="#10b981" delay={1000} />

              {/* Centre icon */}
              <View style={[styles.sonarCenter, { width: SONAR * 0.36, height: SONAR * 0.36, borderRadius: SONAR * 0.18 }]}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.sonarGrad}>
                  <RemixIcon name="ri-moped-fill" size={SONAR * 0.33} color="#fff" />
                </LinearGradient>
              </View>
            </View>

            {/* Timer */}
            <View style={[styles.timerRow, { marginBottom: isSmall ? 8 : 12 }]}>
              <RemixIcon name="ri-time-line" size={13} color="#94a3b8" />
              <Text style={[styles.timerText, { fontSize: isSmall ? 11 : 12 }]}>Searching for {elapsed}</Text>
            </View>

            <Text style={[styles.searchTitle, { fontSize: isSmall ? 16 : 18 }]}>{STATUS_LABEL[status]}</Text>
            <Text style={[styles.searchSub, { fontSize: isSmall ? 12 : 13, marginBottom: isSmall ? 12 : 18 }]}>{STATUS_SUB[status]}</Text>

            {/* Rider count */}
            {onlineRiders.length > 0 && (
              <View style={[styles.riderCountRow, { marginBottom: isSmall ? 12 : 18 }]}>
                {[...Array(Math.min(onlineRiders.length, 4))].map((_, i) => (
                  <View key={i} style={[styles.riderDot, { marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }]}>
                    <RemixIcon name="ri-user-3-fill" size={12} color="#fff" />
                  </View>
                ))}
                <Text style={styles.riderCountText}>
                  {onlineRiders.length} rider{onlineRiders.length !== 1 ? 's' : ''} available nearby
                </Text>
              </View>
            )}

            {/* Cancel */}
            <TouchableOpacity onPress={handleCancel} style={[styles.cancelBtn, { paddingVertical: isSmall ? 10 : 12 }]} activeOpacity={0.7} disabled={isCancelling}>
              {isCancelling
                ? <ActivityIndicator size="small" color="#ef4444" />
                : <>
                    <RemixIcon name="ri-close-line" size={15} color="#ef4444" />
                    <Text style={[styles.cancelText, { fontSize: isSmall ? 12 : 13 }]}>Cancel request</Text>
                  </>
              }
            </TouchableOpacity>

            {/* ── Cancel Reason Modal ── */}
            <Modal transparent animationType="none" visible={showCancelModal} onRequestClose={closeCancelModal}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Pressable style={styles.modalBackdrop} onPress={closeCancelModal}>
                  <Animated.View
                    style={[
                      styles.cancelSheet,
                      {
                        transform: [{
                          translateY: cancelSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [500, 0] }),
                        }],
                        opacity: cancelSheetAnim,
                      },
                    ]}
                  >
                    <Pressable onPress={() => {}} style={{ width: '100%' }}>
                      {/* Handle */}
                      <View style={styles.sheetHandle} />

                      {/* Header */}
                      <View style={styles.cancelSheetHeader}>
                        <View style={styles.cancelIconCircle}>
                          <RemixIcon name="ri-close-circle-line" size={22} color="#ef4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cancelSheetTitle}>Why are you cancelling?</Text>
                          <Text style={styles.cancelSheetSub}>Your feedback helps us improve the service.</Text>
                        </View>
                      </View>

                      {/* Reasons */}
                      <View style={styles.reasonsList}>
                        {CANCEL_REASONS.map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            activeOpacity={0.75}
                            style={[
                              styles.reasonItem,
                              selectedReason === r.id && styles.reasonItemSelected,
                            ]}
                            onPress={() => setSelectedReason(r.id)}
                          >
                            <View style={[
                              styles.reasonIconBox,
                              selectedReason === r.id && styles.reasonIconBoxSelected,
                            ]}>
                              <RemixIcon name={r.icon} size={16} color={selectedReason === r.id ? '#ef4444' : '#94a3b8'} />
                            </View>
                            <Text style={[
                              styles.reasonLabel,
                              selectedReason === r.id && styles.reasonLabelSelected,
                            ]}>{r.label}</Text>
                            {selectedReason === r.id && (
                              <RemixIcon name="ri-checkbox-circle-fill" size={18} color="#ef4444" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Custom reason input */}
                      {selectedReason === 'other' && (
                        <View style={styles.customInputWrap}>
                          <TextInput
                            style={styles.customInput}
                            placeholder="Tell us more (optional)…"
                            placeholderTextColor="#94a3b8"
                            value={customReason}
                            onChangeText={setCustomReason}
                            multiline
                            maxLength={200}
                          />
                        </View>
                      )}

                      {/* Action buttons */}
                      <View style={styles.cancelSheetActions}>
                        <TouchableOpacity style={styles.keepBtn} onPress={closeCancelModal} activeOpacity={0.8}>
                          <Text style={styles.keepBtnText}>Keep Searching</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmCancelBtn, !selectedReason && styles.confirmCancelBtnDisabled]}
                          onPress={confirmCancel}
                          disabled={!selectedReason}
                          activeOpacity={0.85}
                        >
                          <RemixIcon name="ri-close-line" size={16} color={selectedReason ? '#fff' : '#fca5a5'} />
                          <Text style={[styles.confirmCancelBtnText, !selectedReason && styles.confirmCancelBtnTextDisabled]}>
                            Cancel Ride
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  </Animated.View>
                </Pressable>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Map — flex-based; ratio controlled dynamically via inline style
  mapWrap: { overflow: 'hidden' },
  map:     { flex: 1 },

  // Map badge overlay — positioned relative to screen height
  mapBadgeWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },
  mapBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    maxWidth: '90%',
  },
  mapBadgeSuccess: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: '#f0fdf4' },
  liveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  mapBadgeText: { fontFamily: typography.bold, color: '#374151', flexShrink: 1 },

  // Bottom sheet
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 28, elevation: 14,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    overflow: 'hidden',
  },
  scrollViewContainer: {
    flex: 1,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  sheetScroll: {
    paddingTop: 4,
  },

  // ── Searching ─────────────────────────────────────────────────────────────
  searchBox: { alignItems: 'center' },

  // Sonar wrapper
  sonarWrap: {
    alignItems: 'center', justifyContent: 'center',
  },
  sonarCenter: {
    overflow: 'hidden',
    shadowColor: '#10b981', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  sonarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Timer
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  timerText: { fontFamily: typography.medium, color: '#94a3b8' },

  searchTitle: {
    fontFamily: typography.bold, color: '#0f172a',
    textAlign: 'center', marginBottom: 6,
  },
  searchSub: {
    fontFamily: typography.medium, color: '#64748b',
    textAlign: 'center', lineHeight: 20,
  },

  // Rider dot cluster
  riderCountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 14, borderWidth: 1, borderColor: '#d1fae5',
    alignSelf: 'center',
  },
  riderDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#f0fdf4',
  },
  riderCountText: { fontSize: 12, fontFamily: typography.bold, color: '#059669' },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.15)',
    minWidth: 160, justifyContent: 'center', alignSelf: 'center',
  },
  cancelText: { fontFamily: typography.bold, color: '#ef4444' },

  // ── Cancel reason modal ─────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  cancelSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  cancelSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  cancelIconCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelSheetTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 2,
  },
  cancelSheetSub: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  reasonsList: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  reasonItemSelected: {
    backgroundColor: '#fff5f5',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  reasonIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  reasonIconBoxSelected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
  reasonLabelSelected: {
    color: '#ef4444',
  },
  customInputWrap: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  customInput: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#0f172a',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  cancelSheetActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  keepBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keepBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#475569',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmCancelBtnDisabled: {
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#fff',
  },
  confirmCancelBtnTextDisabled: {
    color: '#fca5a5',
  },

  // ── Found ─────────────────────────────────────────────────────────────────
  foundBox: { alignItems: 'center', paddingTop: 4 },

  successRing: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(16,185,129,0.15)',
  },
  successCircle: {
    alignItems: 'center', justifyContent: 'center',
  },

  foundTitle: {
    fontFamily: typography.bold, color: '#0f172a',
    marginBottom: 6, textAlign: 'center',
  },
  foundSub: {
    fontFamily: typography.medium, color: '#64748b',
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 4,
  },

  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    width: '100%', backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#0f172a', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  riderPhoto: {
    backgroundColor: '#e2e8f0',
  },
  riderMeta: { flex: 1, minWidth: 0 },
  riderName:  { fontFamily: typography.bold, color: '#0f172a' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  ratingText: { fontSize: 12, fontFamily: typography.bold, color: '#f59e0b' },
  ratingDivider: { fontSize: 12, color: '#cbd5e1' },
  verifiedText:  { fontSize: 12, fontFamily: typography.medium, color: '#10b981' },
  nearbyPill: {
    backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: '#d1fae5', flexShrink: 0,
  },
  nearbyText: { fontSize: 11, fontFamily: typography.bold, color: '#10b981' },

  trackBtn: { width: '100%' },
  trackBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
  },
  trackBtnText: { fontFamily: typography.bold, color: '#fff' },
});
