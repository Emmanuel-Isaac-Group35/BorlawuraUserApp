import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { NavigatrMap } from '../../../components/feature/NavigatrMap';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';
import { supabase } from '../../../lib/supabase';
import { sendLocalNotification } from '../../../utils/notifications';

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


export const FindingRider: React.FC<FindingRiderProps> = ({ userLat, userLng, orderId, selectedRiderId, onRiderFound, onCancel }) => {
  const { width } = useWindowDimensions();
  const [status, setStatus] = useState<'searching' | 'connecting' | 'waiting' | 'found'>(selectedRiderId ? 'connecting' : 'searching');
  const [localRider, setLocalRider] = useState<Rider | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [targetRider, setTargetRider] = useState<any>(null);
  
  const lat = userLat || 5.6037;
  const lng = userLng || -0.1870;
  const [onlineRiders, setOnlineRiders] = useState<{id: string, lat: number, lng: number}[]>([]);

  useEffect(() => {
    const fetchOnlineRiders = async () => {
      const { data } = await supabase.from('riders').select('id, latitude, longitude').eq('is_online', true).limit(8);
      if (data) setOnlineRiders(data.map(r => ({ id: r.id, lat: r.latitude || lat + (Math.random()-0.5)*0.01, lng: r.longitude || lng + (Math.random()-0.5)*0.01 })));
    };
    fetchOnlineRiders();
  }, [lat, lng]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!orderId) return;

    // 1. Initial State Check (Backup if the real-time update was missed)
    const checkInitialStatus = async () => {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, rider_id')
        .eq('id', orderId)
        .single();
      
      if (order && order.rider_id && ['accepted', 'assigned', 'confirmed', 'active', 'in_progress', 'heading', 'arrived', 'completed'].includes(order.status)) {
          const { data: riderData } = await supabase.from('riders').select('*').eq('id', order.rider_id).single();
          if (riderData) {
            const riderObj: Rider = {
              id: riderData.id,
              name: riderData.full_name || 'Borla Rider',
              rating: parseFloat(riderData.rating || '4.8'),
              phone: riderData.phone_number || '',
              photo: riderData.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              distance: 'Nearby',
              lat: riderData.latitude,
              lng: riderData.longitude
            };
            setLocalRider(riderObj);
            setStatus('found');
            // Give 1 second for the UI to feel "Found" then transition
            setTimeout(() => onRiderFound(riderObj), 1000);
          }
      }
    };
    checkInitialStatus();

    // 1.5 Heartbeat Backup (Polling every 5s in case real-time fails)
    const heartbeat = setInterval(checkInitialStatus, 5000);

    // 2. Real-time Subscription (Live Updates)
    const channel = supabase.channel(`order-sync-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, async (payload: any) => {
          console.log('📦 Real-time Status Sync:', payload.new.status);
          if (payload.new.rider_id) {
            const { data: riderData } = await supabase.from('riders').select('*').eq('id', payload.new.rider_id).single();
            if (riderData) {
              const riderObj: Rider = {
                id: riderData.id,
                name: riderData.full_name || 'Borla Rider',
                rating: parseFloat(riderData.rating || '4.8'),
                phone: riderData.phone_number || '',
                photo: riderData.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                distance: 'Nearby',
                lat: riderData.latitude,
                lng: riderData.longitude
              };
              setLocalRider(riderObj);
              if (['accepted', 'assigned', 'confirmed', 'active', 'in_progress', 'heading', 'arrived', 'completed'].includes(payload.new.status)) {
                setStatus('found');
                sendLocalNotification(
                  'Order Accepted!',
                  `${riderObj.name} has accepted your request.`,
                  { orderId }
                );
                setTimeout(() => onRiderFound(riderObj), 2000);
              } else {
                setStatus('waiting');
              }
            }
          }
      }).subscribe((status) => {
        console.log(`🔌 Sync Channel for ${orderId}:`, status);
      });

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(heartbeat);
    };
  }, [orderId]);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <NavigatrMap 
          style={styles.map}
          centerLat={lat} 
          centerLng={lng}
          zoom={15}
          interactive={false}
          markers={[
            { lat, lng, type: 'user', label: 'Scanning...' },
            ...onlineRiders.filter(r => r.lat && r.lng).map(r => ({ lat: r.lat, lng: r.lng, type: 'rider' as const, label: 'Rider' }))
          ]}
        />
        <View style={styles.topOverlay}>
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>
              {status === 'searching' ? 'Searching nearby...' :
               status === 'connecting' ? 'Connecting to rider...' :
               status === 'waiting' ? 'Waiting for confirmation...' : 'Rider Found!'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetContent}>
           {status === 'found' ? (
             <View style={styles.foundBox}>
                <View style={styles.successCircle}>
                  <RemixIcon name="ri-check-line" size={32} color="#fff" />
                </View>
                <Text style={styles.foundTitle}>Pickup Confirmed</Text>
                <View style={styles.riderCard}>
                   <Image source={{ uri: localRider?.photo }} style={styles.riderImg} />
                   <View style={styles.riderInfo}>
                      <Text style={styles.riderName}>{localRider?.name}</Text>
                      <View style={styles.ratingRow}>
                         <RemixIcon name="ri-star-fill" size={12} color="#fbbf24" />
                         <Text style={styles.ratingText}>{localRider?.rating}</Text>
                      </View>
                   </View>
                </View>
             </View>
           ) : (
             <View style={styles.searchingBox}>
                <Animated.View style={[styles.radarBox, { transform: [{ scale: pulseAnim }] }]}>
                   <View style={styles.radarCircle}>
                      <RemixIcon name="ri-radar-line" size={40} color="#10b981" />
                   </View>
                </Animated.View>
                <Text style={styles.searchingTitle}>Finding your Rider</Text>
                <Text style={styles.searchingDesc}>
                   We are connecting you with the best available rider in your area for a swift collection.
                </Text>
                <View style={styles.loaderLine}>
                   <Animated.View style={[styles.loaderFill, { width: '100%', opacity: 0.6 }]} />
                </View>
                <TouchableOpacity 
                   onPress={async () => {
                      if (orderId) {
                        await supabase.from('orders').update({ status: 'cancelled', sub_status: 'cancelled' }).eq('id', orderId);
                      }
                      onCancel();
                   }} 
                   style={styles.cancelBtn}
                >
                   <Text style={styles.cancelText}>Cancel Search</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapWrap: { flex: 1, minHeight: 300, overflow: 'hidden' },
  map: { flex: 1, borderRadius: 0 },
  topOverlay: { position: 'absolute', top: 100, left: 0, right: 0, alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 10 },
  statusText: { fontSize: 13, fontFamily: typography.bold, color: '#0f172a' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  sheetContent: { alignItems: 'center' },
  searchingBox: { width: '100%', alignItems: 'center' },
  radarBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  radarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  searchingTitle: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a', marginBottom: 8 },
  searchingDesc: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loaderLine: { width: '100%', height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginBottom: 32 },
  loaderFill: { height: '100%', backgroundColor: '#10b981' },
  cancelBtn: { padding: 12 },
  cancelText: { fontSize: 14, fontFamily: typography.bold, color: '#ef4444' },
  foundBox: { width: '100%', alignItems: 'center' },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  foundTitle: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a', marginBottom: 20 },
  riderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, width: '100%' },
  riderImg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#e2e8f0' },
  riderInfo: { marginLeft: 16 },
  riderName: { fontSize: 16, fontFamily: typography.bold, color: '#0f172a' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, fontFamily: typography.bold, color: '#475569' },
});
