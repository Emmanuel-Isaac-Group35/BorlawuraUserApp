import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import { NavigatrMap } from '../../components/feature/NavigatrMap';
import { typography } from '../../utils/typography';
import { sendLocalNotification } from '../../utils/notifications';
import { useAlert } from '../../context/AlertContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const TrackOrderPage: React.FC = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { width: W, height: H } = useWindowDimensions();
  const isSmall = H < 700;
  const mapHeight = H < 700 ? 320 : (H < 850 ? 400 : 480);
  const { id: orderId } = (route.params as { id?: string }) || {};
  const { showAlert } = useAlert();
  const [order, setOrder] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState({ lat: 5.6037, lng: -0.1870, heading: 0 });
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const getOrderRiderCoords = (row: any) => {
    const lat = parseFloat(row?.rider_lat);
    const lng = parseFloat(row?.rider_lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        setUserLocation(initialLoc);
        watchSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
          (newLocation) => setUserLocation(newLocation)
        );
      } catch (e) { console.log("GPS Lock Failed:", e); }
    })();
    return () => { if (watchSubscription.current) watchSubscription.current.remove(); };
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoadError('No order selected.');
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoadError(null);
        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (orderError) throw orderError;
        let riderObj = null;

        if (orderData.rider_id) {
          const { data: riderData } = await supabase.from('riders').select('*').eq('id', orderData.rider_id).single();
          if (riderData) {
            const orderRiderCoords = getOrderRiderCoords(orderData);
            const riderLat = orderRiderCoords?.lat ?? parseFloat(riderData.latitude);
            const riderLng = orderRiderCoords?.lng ?? parseFloat(riderData.longitude);
            const pickupLat = parseFloat(orderData.pickup_latitude);
            const pickupLng = parseFloat(orderData.pickup_longitude);

            riderObj = {
              id: riderData.id,
              name: riderData.full_name || 'Your Rider',
              phone: riderData.phone_number || '+233 24 000 0000',
              vehicle: riderData.vehicle_info || 'Tricycle',
              vehicleNumber: riderData.vehicle_number || 'TRC-102-GH',
              photo: riderData.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              lat: Number.isFinite(riderLat) ? riderLat : 5.6037,
              lng: Number.isFinite(riderLng) ? riderLng : -0.1870,
            };
            setRiderLocation({
              lat: riderObj.lat,
              lng: riderObj.lng,
              heading: Number(orderData.rider_heading ?? riderData.heading ?? 0) || 0
            });
          }
        }

        setOrder({
          id: orderData.id.slice(0, 8).toUpperCase(),
          realId: orderData.id,
          status: orderData.status,
          service: orderData.service_type || 'Waste Pickup',
          address: orderData.address,
          latitude: orderData.pickup_latitude,
          longitude: orderData.pickup_longitude,
          rider: riderObj
        });
      } catch (e) {
        console.error('[TrackOrder] Fetch error:', e);
        setLoadError('Unable to load this order. It may have been removed or you may not have access.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const orderChannel = supabase.channel(`order-tracking-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, async (payload) => {
        const orderData = payload.new;
        const nextRiderCoords = getOrderRiderCoords(orderData);

        setOrder((prev: any) => prev ? ({
          ...prev,
          status: orderData.status,
          latitude: orderData.pickup_latitude ?? prev.latitude,
          longitude: orderData.pickup_longitude ?? prev.longitude,
        }) : prev);

        if (nextRiderCoords) {
          setRiderLocation((prev) => ({
            lat: nextRiderCoords.lat,
            lng: nextRiderCoords.lng,
            heading: Number(orderData.rider_heading ?? prev.heading ?? 0) || 0
          }));
        }
      }).subscribe();
    return () => { supabase.removeChannel(orderChannel); };
  }, [orderId]);

  const cancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.realId);
              if (error) throw error;
              setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
              showAlert('Order Cancelled', 'Your order has been cancelled successfully.', 'success');
              navigation.goBack();
            } catch (err) {
              showAlert('Error', 'Could not cancel the order. Please try again.', 'error');
            }
          }
        }
      ]
    );
  };

  const trackingSteps = [
    { title: 'Request Received', completed: true },
    { title: 'Rider Assigned', completed: !!order?.rider },
    { title: 'In Transit', completed: ['heading', 'arrived', 'completed'].includes(order?.status?.toLowerCase()) },
    { title: 'Arrived', completed: ['arrived', 'completed'].includes(order?.status?.toLowerCase()) },
    { title: 'Pickup complete', completed: order?.status === 'completed' }
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#10b981" /><Text style={styles.loaderText}>Loading your order…</Text></View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Navigation />
        <View style={[styles.loaderContainer, { paddingTop: insets.top + 84 }]}>
          <RemixIcon name="ri-error-warning-line" size={40} color="#f59e0b" />
          <Text style={styles.loaderText}>{loadError || 'Order not found'}</Text>
          <TouchableOpacity onPress={() => navigateTo('/orders')} style={styles.errorBtn}>
            <Text style={styles.errorBtnText}>View all orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pickupLat = parseFloat(order.latitude);
  const pickupLng = parseFloat(order.longitude);
  const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
  const mapMarkers = [
    { id: order?.rider?.id, lat: riderLocation.lat, lng: riderLocation.lng, type: 'rider' as const, label: order?.rider?.name || 'Rider', heading: riderLocation.heading },
    ...(hasPickupCoords ? [{ id: 'pickup-point', lat: pickupLat, lng: pickupLng, type: 'landmark' as const, label: 'Pickup Point' }] : []),
    ...(userLocation ? [{ id: 'user-loc', lat: userLocation.coords.latitude, lng: userLocation.coords.longitude, type: 'user' as const, label: user?.full_name || 'You' }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingTop: insets.top + 84, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        
        <View style={styles.floatHeader}>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>Order #{order.id}</Text>
          </View>
        </View>

        <View style={[styles.mapCard, { marginHorizontal: isSmall ? 12 : 20 }]}>
          <NavigatrMap 
             centerLat={riderLocation.lat} 
             centerLng={riderLocation.lng} 
             zoom={16}
             height={mapHeight}
             variant="light"
             markers={mapMarkers}
             showRadar={false}
             fitToMarkers={true}
          />
        </View>

        {order.rider && (
          <View style={[styles.riderCard, { margin: isSmall ? 12 : 20, padding: isSmall ? 12 : 20 }]}>
            <Image source={{ uri: order.rider.photo }} style={styles.riderAvatar} />
            <View style={styles.riderInfo}>
               <Text style={styles.riderName}>{order.rider.name}</Text>
               <Text style={styles.vehicleText}>{order.rider.vehicle} · <Text style={{ color: '#0f172a', fontFamily: typography.bold }}>{order.rider.vehicleNumber}</Text></Text>
            </View>
            <View style={styles.riderActions}>
               <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.rider.phone}`)} style={styles.actionBtn}><RemixIcon name="ri-phone-fill" size={20} color="#fff" /></TouchableOpacity>
               <TouchableOpacity onPress={() => navigation.navigate('ChatRider', { riderId: order.rider.id, orderId: order.realId })} style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}><RemixIcon name="ri-message-3-fill" size={20} color="#64748b" /></TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.trackerSection}>
           <Text style={styles.sectionLabel}>Order Progress</Text>
           <View style={styles.trackerList}>
              {trackingSteps.map((step, idx) => (
                <View key={idx} style={[styles.stepRow, { minHeight: isSmall ? 48 : 60, paddingBottom: isSmall ? 8 : 12 }]}>
                   <View style={styles.indicatorCol}>
                      <View style={[styles.stepCircle, step.completed && styles.stepCircleDone]}>
                         {step.completed ? <RemixIcon name="ri-check-line" size={12} color="#fff" /> : <View style={styles.stepDot} />}
                      </View>
                      {idx < trackingSteps.length - 1 && <View style={[styles.stepLine, step.completed && styles.stepLineDone]} />}
                   </View>
                   <View style={styles.stepTextCol}>
                      <Text style={[styles.stepTitle, step.completed && styles.stepTitleDone]}>{step.title}</Text>
                   </View>
                </View>
              ))}
           </View>
        </View>

        {['pending', 'scheduled'].includes(order.status?.toLowerCase()) && (
          <TouchableOpacity onPress={cancelOrder} style={styles.cancelOrderBtn}>
            <RemixIcon name="ri-close-circle-line" size={18} color="#ef4444" />
            <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigateTo('/home')} style={styles.footerBtn}>
          <RemixIcon name="ri-home-4-line" size={16} color="#0d9488" />
           <Text style={styles.footerBtnText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  scrollView: { flex: 1 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#fdfdfd' },
  loaderText: { fontSize: 14, fontFamily: typography.bold, color: '#64748b' },
  floatHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  orderIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  orderIdText: { fontSize: 11, fontFamily: typography.bold, color: '#475569' },
  mapCard: { marginHorizontal: 20, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3 },
  riderCard: { margin: 20, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#ffffff', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  riderAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#f8fafc' },
  riderInfo: { flex: 1, marginLeft: 16 },
  riderName: { fontSize: 17, fontFamily: typography.bold, color: '#0f172a' },
  vehicleText: { fontSize: 12, fontFamily: typography.medium, color: '#64748b', marginTop: 2 },
  riderActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  trackerSection: { paddingHorizontal: 24, marginTop: 12 },
  sectionLabel: { fontSize: 12, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 1.5, marginBottom: 24 },
  trackerList: { paddingLeft: 8 },
  stepRow: { flexDirection: 'row', minHeight: 60, paddingBottom: 12 },
  indicatorCol: { alignItems: 'center', width: 24 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  stepCircleDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  stepLineDone: { backgroundColor: '#10b981' },
  stepTextCol: { marginLeft: 20 },
  stepTitle: { fontSize: 15, fontFamily: typography.bold, color: '#94a3b8' },
  stepTitleDone: { color: '#0f172a' },
  footerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  footerBtnText: { fontSize: 13, fontFamily: typography.bold, color: '#0d9488' },
  errorBtn: { marginTop: 8, backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  errorBtnText: { fontSize: 13, fontFamily: typography.bold, color: '#fff' },
  cancelOrderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 24, marginTop: 32, marginBottom: 8, paddingVertical: 14, backgroundColor: '#fef2f2', borderRadius: 16, borderWidth: 1, borderColor: '#fecaca' },
  cancelOrderBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#ef4444' },
});

export default TrackOrderPage;
