import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { typography } from '../../utils/typography';
import { sendLocalNotification } from '../../utils/notifications';

const getMapHtml = (riderLat: number, riderLng: number, userLat?: number, userLng?: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; background: #f8fafc; }
    .rider-container { display: flex; flex-direction: column; align-items: center; }
    .rider-pulse {
      width: 44px; height: 44px;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 50%;
      position: absolute;
      animation: pulse 2s infinite;
    }
    .rider-icon {
      width: 24px; height: 24px;
      background: #10b981;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10;
    }
    .user-icon {
      width: 20px; height: 20px;
      background: #0f172a;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
    const riderIcon = L.divIcon({
      className: 'rider-container',
      html: '<div class="rider-pulse"></div><div class="rider-icon"></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
    const userIcon = L.divIcon({ className: 'user-icon', iconSize: [20, 20], iconAnchor: [10, 10] });
    const riderMarker = L.marker([${riderLat}, ${riderLng}], { icon: riderIcon }).addTo(map);
    const markers = [[${riderLat}, ${riderLng}]];
    if (${!!(userLat && userLng)}) {
      L.marker([${userLat || 0}, ${userLng || 0}], { icon: userIcon }).addTo(map);
      markers.push([${userLat || 0}, ${userLng || 0}]);
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView([${riderLat}, ${riderLng}], 16);
    }
  </script>
</body>
</html>
`;

const TrackOrderPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { id: orderId } = (route.params as { id?: string }) || {};
  const [order, setOrder] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState({ lat: 5.6037, lng: -0.1870 });
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        let riderObj = null;
        if (orderData.rider_id) {
          const { data: riderData, error: riderError } = await supabase
            .from('riders')
            .select('*')
            .eq('id', orderData.rider_id)
            .single();

          if (!riderError && riderData) {
            riderObj = {
              name: riderData.full_name || (riderData.first_name ? `${riderData.first_name} ${riderData.last_name || ''}`.trim() : 'Your Rider'),
              phone: riderData.phone_number || riderData.phone || '+233 24 000 0000',
              rating: riderData.rating ? parseFloat(riderData.rating) : 4.8,
              vehicle: riderData.vehicle_info || 'Tricycle',
              vehicleNumber: riderData.vehicle_number || 'TRC-102-GH',
              photo: riderData.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              lat: riderData.latitude || 5.6037,
              lng: riderData.longitude || -0.1870
            };
            setRiderLocation({ lat: riderObj.lat, lng: riderObj.lng });
          }
        }

        setOrder({
          id: orderData.id.slice(0, 8).toUpperCase(),
          realId: orderData.id,
          status: orderData.status,
          service: orderData.service_type || 'Waste Pickup',
          date: new Date(orderData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          time: orderData.scheduled_at ? new Date(orderData.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date(orderData.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          address: orderData.address,
          latitude: orderData.pickup_latitude,
          longitude: orderData.pickup_longitude,
          rider: riderObj,
          wasteType: orderData.waste_type || 'General Household',
          bagSize: (orderData.waste_size || 'Standard').charAt(0).toUpperCase() + (orderData.waste_size || 'Standard').slice(1),
          estimatedArrival: riderObj ? '12 mins' : 'Calculating...',
          currentLocation: ['in_progress', 'active'].includes(orderData.status) ? 'Approaching your location' : (['accepted', 'assigned', 'confirmed'].includes(orderData.status) ? 'Rider heading out' : 'Waiting for dispatch')
        });
      } catch (error) {
        console.error("Error fetching order data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const orderChannel = supabase
      .channel(`order-tracking-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, async (payload: any) => {
          // Re-fetch everything to ensure rider data and status are synced
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          if (orderData) {
            let riderObj = null;
            if (orderData.rider_id) {
              const { data: riderData } = await supabase
                .from('riders')
                .select('*')
                .eq('id', orderData.rider_id)
                .single();
              
              if (riderData) {
                riderObj = {
                  name: riderData.full_name || (riderData.first_name ? `${riderData.first_name} ${riderData.last_name || ''}`.trim() : 'Your Rider'),
                  phone: riderData.phone_number || riderData.phone || '+233 24 000 0000',
                  rating: riderData.rating ? parseFloat(riderData.rating) : 4.8,
                  vehicle: riderData.vehicle_info || 'Tricycle',
                  vehicleNumber: riderData.vehicle_number || 'TRC-102-GH',
                  photo: riderData.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                  lat: riderData.latitude || 5.6037,
                  lng: riderData.longitude || -0.1870
                };
                setRiderLocation({ lat: riderObj.lat, lng: riderObj.lng });
              }
            }

            setOrder((prev: any) => ({
              ...prev,
              status: orderData.status,
              rider: riderObj || prev?.rider,
              currentLocation: orderData.status === 'in_progress' ? 'Approaching your location' : (orderData.status === 'accepted' ? 'Rider heading out' : 'Waiting for dispatch')
            }));

            if (['accepted', 'assigned', 'confirmed', 'active'].includes(orderData.status) && riderObj) {
               sendLocalNotification(
                 'Pickup Accepted!',
                 `${riderObj.name} is on the way to your location.`,
                 { orderId }
               );
            } else if (orderData.status === 'in_progress') {
               sendLocalNotification(
                 'Rider Arriving',
                 'Your rider is nearly at your location for pickup.',
                 { orderId }
               );
            }
          }
      }).subscribe();
    return () => { supabase.removeChannel(orderChannel); };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !isLiveTracking) return;
    let riderChannel: any;
    const setupRiderSubscription = async () => {
      const { data: currentOrder } = await supabase.from('orders').select('rider_id').eq('id', orderId).single();
      if (currentOrder?.rider_id) {
        riderChannel = supabase.channel(`rider-loc-${currentOrder.rider_id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'riders', filter: `id=eq.${currentOrder.rider_id}` }, (payload: any) => {
              if (payload.new.latitude && payload.new.longitude) {
                setRiderLocation({ lat: parseFloat(payload.new.latitude), lng: parseFloat(payload.new.longitude) });
              }
          }).subscribe();
      }
    };
    setupRiderSubscription();
    return () => { if (riderChannel) supabase.removeChannel(riderChannel); };
  }, [orderId, isLiveTracking]);

  const trackingSteps = [
    { title: 'Order Confirmed', description: 'Request received', completed: true },
    { title: 'Rider Assigned', description: order?.rider ? `${order.rider.name} is on the way` : 'Assigning rider', completed: !!order?.rider },
    { title: 'Pickup Progress', description: 'Rider approaching', active: ['in_progress', 'active'].includes(order?.status) },
    { title: 'Completed', description: 'Waste collected', completed: order?.status === 'completed' }
  ];

  const handleCallRider = async () => {
    if (!order?.rider?.phone) return;
    Linking.openURL(`tel:${order.rider.phone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loaderText}>Syncing tracker...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 100
          }
        ]} 
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.mapCard}>
          <View style={styles.mapWrapper}>
            <WebView source={{ html: getMapHtml(riderLocation.lat, riderLocation.lng, order.latitude, order.longitude) }} style={styles.map} />
          </View>
          <View style={styles.mapInfo}>
            <View>
              <Text style={styles.currentLocation}>{order.currentLocation}</Text>
              <Text style={styles.etaText}>Eta: <Text style={styles.etaValue}>{order.estimatedArrival}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => setIsLiveTracking(!isLiveTracking)} style={[styles.liveToggle, isLiveTracking && styles.liveToggleActive]}>
              <RemixIcon name={isLiveTracking ? "ri-wifi-line" : "ri-wifi-off-line"} size={18} color={isLiveTracking ? "#10b981" : "#94a3b8"} />
            </TouchableOpacity>
          </View>
        </View>

        {order.rider && (
          <View style={styles.riderCard}>
            <Image source={{ uri: order.rider.photo }} style={styles.riderAvatar} />
            <View style={styles.riderInfo}>
               <View style={styles.riderNameRow}>
                <Text style={styles.riderName}>{order.rider.name}</Text>
                <View style={styles.ratingBox}>
                    <RemixIcon name="ri-star-fill" size={10} color="#fbbf24" />
                    <Text style={styles.ratingText}>{order.rider.rating}</Text>
                </View>
               </View>
               <Text style={styles.vehicleText}>{order.rider.vehicle} • {order.rider.vehicleNumber}</Text>
            </View>
            <TouchableOpacity onPress={handleCallRider} style={styles.callSmallBtn}>
                <RemixIcon name="ri-phone-fill" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.trackerList}>
           {trackingSteps.map((step, idx) => (
             <View key={idx} style={styles.stepItem}>
                <View style={styles.stepIndicator}>
                    <View style={[styles.stepCircle, (step.completed || step.active) && styles.stepCircleDone]}>
                        {(step.completed || step.active) ? <RemixIcon name={step.completed ? "ri-check-line" : "ri-time-line"} size={12} color="#fff" /> : <View style={styles.stepDot} />}
                    </View>
                    {idx < trackingSteps.length - 1 && <View style={[styles.stepLine, step.completed && styles.stepLineDone]} />}
                </View>
                <View style={styles.stepText}>
                    <Text style={[styles.stepTitle, (step.completed || step.active) && styles.stepTitleActive]}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
             </View>
           ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, fontFamily: typography.medium, color: '#64748b' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.semiBold, color: '#94a3b8', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 6 },
  statusBadgeActive: { backgroundColor: '#f0fdf4' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94a3b8' },
  statusDotActive: { backgroundColor: '#10b981' },
  statusBadgeText: { fontSize: 10, fontFamily: typography.bold, color: '#64748b' },
  mapCard: { backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24, elevation: 4 },
  mapWrapper: { height: 220 },
  map: { flex: 1 },
  mapInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  currentLocation: { fontSize: 15, fontFamily: typography.bold, color: '#1e293b', marginBottom: 2 },
  etaText: { fontSize: 13, fontFamily: typography.medium, color: '#64748b' },
  etaValue: { color: '#10b981', fontFamily: typography.bold },
  liveToggle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  liveToggleActive: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  riderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 20, marginBottom: 24 },
  riderAvatar: { width: 44, height: 44, borderRadius: 12 },
  riderInfo: { flex: 1, marginLeft: 12 },
  riderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  riderName: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, gap: 3 },
  ratingText: { fontSize: 10, fontFamily: typography.bold, color: '#fbbf24' },
  vehicleText: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },
  callSmallBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  trackerList: { paddingLeft: 8, marginBottom: 24 },
  stepItem: { flexDirection: 'row' },
  stepIndicator: { alignItems: 'center', width: 24 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepCircleDone: { backgroundColor: '#10b981' },
  stepDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#f1f5f9', marginVertical: 2 },
  stepLineDone: { backgroundColor: '#10b981' },
  stepText: { flex: 1, marginLeft: 16, paddingBottom: 20 },
  stepTitle: { fontSize: 14, fontFamily: typography.bold, color: '#94a3b8' },
  stepTitleActive: { color: '#0f172a' },
  stepDesc: { fontSize: 12, fontFamily: typography.regular, color: '#64748b', marginTop: 2 },
  backHomeBtn: { alignItems: 'center', paddingVertical: 12 },
  backHomeText: { fontSize: 14, fontFamily: typography.semiBold, color: '#64748b' }
});

export default TrackOrderPage;
