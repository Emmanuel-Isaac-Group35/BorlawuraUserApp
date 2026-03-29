import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

const getMapHtml = (riderLat: number, riderLng: number, userLat?: number, userLng?: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
    .rider-icon {
      background-color: #3b82f6;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .user-icon {
      background-color: #10b981;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: 'OpenStreetMap'
    }).addTo(map);

    const riderIcon = L.divIcon({
      className: 'rider-icon',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const userIcon = L.divIcon({
      className: 'user-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const markers = [];
    const riderMarker = L.marker([${riderLat}, ${riderLng}], { icon: riderIcon, title: 'Rider' }).addTo(map);
    markers.push([${riderLat}, ${riderLng}]);

    if (${!!(userLat && userLng)}) {
      L.marker([${userLat || 0}, ${userLng || 0}], { icon: userIcon, title: 'Your Location' }).addTo(map);
      markers.push([${userLat || 0}, ${userLng || 0}]);
      map.fitBounds(L.latLngBounds(markers), { padding: [50, 50] });
    } else {
      map.setView([${riderLat}, ${riderLng}], 15);
    }
  </script>
</body>
</html>
`;

const TrackOrderPage: React.FC = () => {
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
        // Fetch order details first
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // If rider is assigned, fetch rider details
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
              photo: riderData.avatar_url || 'https://readdy.ai/api/search-image?query=Professional%20African%20male%20waste%20collection%20worker%2C%20friendly%20smile%2C%20uniform%2C%20safety%20equipment%2C%20confident%20expression%2C%20clean%20background%2C%20high-quality%20portrait%20photography&width=100&height=100&seq=rider_found&orientation=squarish',
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
          date: new Date(orderData.created_at).toLocaleDateString('en-GB'),
          time: orderData.scheduled_at ? new Date(orderData.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date(orderData.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          address: orderData.address,
          latitude: orderData.pickup_latitude,
          longitude: orderData.pickup_longitude,
          rider: riderObj,
          amount: '₵' + (typeof orderData.amount === 'number' ? orderData.amount.toFixed(2) : (orderData.amount || '0.00')),
          wasteType: orderData.waste_type || 'General Household',
          bagSize: (orderData.waste_size || 'Standard').charAt(0).toUpperCase() + (orderData.waste_size || 'Standard').slice(1),
          estimatedArrival: riderObj ? '12 mins' : 'Calculating...',
          currentLocation: orderData.status === 'in_progress' ? 'Rider approaching your location' : (orderData.status === 'accepted' ? 'Rider heading out' : 'Waiting for dispatch')
        });
      } catch (error) {
        console.error("Error fetching order data:", error);
        Alert.alert("Error", "Failed to fetch order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  // Real-time subscription for the order (to catch rider assignment/status changes)
  useEffect(() => {
    if (!orderId) return;

    const orderChannel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async (payload: any) => {
          console.log('Order status update received:', payload);
          const { data: orderData, error } = await supabase
            .from('orders')
            .select('*, riders(*)')
            .eq('id', orderId)
            .single();
          
          if (!error && orderData) {
            setOrder((prev: any) => ({
              ...prev,
              status: orderData.status,
              rider_id: orderData.rider_id,
              currentLocation: orderData.status === 'in_progress' ? 'Rider approaching' : prev?.currentLocation
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [orderId]);

  // Real-time subscription for rider location
  useEffect(() => {
    if (!orderId || !isLiveTracking) return;

    let riderChannel: any;

    const setupRiderSubscription = async () => {
      const { data: currentOrder } = await supabase.from('orders').select('rider_id').eq('id', orderId).single();
      
      if (currentOrder?.rider_id) {
        riderChannel = supabase
          .channel(`rider-loc-${currentOrder.rider_id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'riders',
              filter: `id=eq.${currentOrder.rider_id}`,
            },
            (payload: any) => {
              if (payload.new.latitude && payload.new.longitude) {
                setRiderLocation({
                  lat: parseFloat(payload.new.latitude),
                  lng: parseFloat(payload.new.longitude)
                });
              }
            }
          )
          .subscribe();
      }
    };

    setupRiderSubscription();

    return () => {
      if (riderChannel) supabase.removeChannel(riderChannel);
    };
  }, [orderId, isLiveTracking, order?.status]);

  const trackingSteps = [
    {
      id: 1,
      title: 'Order Confirmed',
      description: 'Your pickup request has been confirmed',
      time: order?.time,
      completed: !!order
    },
    {
      id: 2,
      title: 'Rider Assigned',
      description: order?.rider ? `${order.rider.name} is on the way` : 'Assigning nearest rider',
      time: '',
      completed: !!order?.rider
    },
    {
      id: 3,
      title: 'Rider Arriving',
      description: 'Rider is approaching your location',
      time: '',
      completed: false,
      active: !!order?.rider && order.status === 'in_progress'
    },
    {
      id: 4,
      title: 'Pickup Complete',
      description: 'Waste collected and disposed properly',
      time: '',
      completed: order?.status === 'completed'
    }
  ];

  const handleCallRider = async () => {
    if (!order?.rider?.phone) return;
    try {
      await Linking.openURL(`tel:${order.rider.phone}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to place call');
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            if (!orderId) return;
            try {
              await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
              navigateTo('/');
            } catch (err) {
              Alert.alert("Error", "Failed to cancel order.");
            }
          }
        }
      ]
    );
  };

  const handleShareLocation = async () => {
    try {
      const message = `Track my waste pickup at: ${order?.address}`;
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        Alert.alert('Share', 'Sharing functionality would be implemented here');
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to share location');
    }
  };

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
  };

  if (loading) {
     return (
       <SafeAreaView style={styles.container}>
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <ActivityIndicator size="large" color="#10b981" />
           <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading tracking data...</Text>
         </View>
       </SafeAreaView>
     );
  }

  if (!order) {
     return (
       <SafeAreaView style={styles.container}>
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
           <RemixIcon name="ri-error-warning-line" size={48} color="#ef4444" />
           <Text style={{ marginTop: 12, color: '#1f2937', fontWeight: 'bold' }}>Order Not Found</Text>
           <TouchableOpacity onPress={() => navigateTo('/')} style={{ marginTop: 24, padding: 12, backgroundColor: '#10b981', borderRadius: 8 }}>
             <Text style={{ color: '#fff' }}>Go Back Home</Text>
           </TouchableOpacity>
         </View>
       </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <BottomNavigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Live Tracking</Text>
            <View style={styles.liveIndicator}>
              <View style={[styles.liveDot, isLiveTracking && styles.liveDotActive]} />
              <Text style={[styles.liveText, isLiveTracking && styles.liveTextActive]}>
                {isLiveTracking ? 'LIVE' : 'PAUSED'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Order #{order.id}</Text>
        </View>

        <View style={styles.mapContainer}>
          <View style={styles.mapWrapper}>
            <WebView
              source={{ html: getMapHtml(riderLocation.lat, riderLocation.lng, order.latitude, order.longitude) }}
              style={styles.map}
              scrollEnabled={true}
            />
          </View>

          <View style={styles.mapOverlay}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDotSmall} />
              <Text style={styles.liveBadgeText}>Live Location</Text>
            </View>
          </View>

          <View style={styles.mapControls}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>{order.currentLocation}</Text>
              <Text style={styles.etaText}>ETA: {order.estimatedArrival}</Text>
            </View>
            <View style={styles.controlButtons}>
              <TouchableOpacity
                onPress={handleShareLocation}
                style={styles.controlButton}
              >
                <RemixIcon name="ri-share-line" size={20} color="#4b5563" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleLiveTracking}
                style={[styles.controlButton, isLiveTracking && styles.controlButtonActive]}
              >
                <RemixIcon
                  name={isLiveTracking ? 'ri-pause-line' : 'ri-play-line'}
                  size={20}
                  color={isLiveTracking ? '#10b981' : '#4b5563'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {order.rider && (
        <View style={styles.riderCard}>
          <View style={styles.riderHeader}>
            <Text style={styles.riderCardTitle}>Your Rider</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>

          <View style={styles.riderInfo}>
            <View style={styles.riderImageContainer}>
              <Image
                source={{ uri: order.rider.photo }}
                style={styles.riderImage}
                resizeMode="cover"
              />
              <View style={styles.riderStatusBadge}>
                <RemixIcon name="ri-check-line" size={12} color="#ffffff" />
              </View>
            </View>

            <View style={styles.riderDetails}>
              <View style={styles.riderNameRow}>
                <Text style={styles.riderName}>{order.rider.name}</Text>
                <View style={styles.ratingContainer}>
                  <RemixIcon name="ri-star-fill" size={14} color="#fbbf24" />
                  <Text style={styles.rating}>{order.rider.rating}</Text>
                </View>
              </View>
              <Text style={styles.riderVehicle}>{order.rider.vehicle}</Text>
              <Text style={styles.riderPhone}>{order.rider.phone}</Text>
            </View>

            <View style={styles.riderActions}>
              <TouchableOpacity
                onPress={handleCallRider}
                style={styles.callRiderButton}
              >
                <RemixIcon name="ri-phone-line" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo('/chat-rider')}
                style={styles.chatRiderButton}
              >
                <RemixIcon name="ri-chat-3-line" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        )}

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Order Progress</Text>

          <View style={styles.progressSteps}>
            {trackingSteps.map((step, index) => (
              <View key={step.id} style={styles.progressStep}>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepCircle,
                    step.completed && styles.stepCircleCompleted,
                    step.active && styles.stepCircleActive
                  ]}>
                    {step.completed ? (
                      <RemixIcon name="ri-check-line" size={16} color="#ffffff" />
                    ) : step.active ? (
                      <RemixIcon name="ri-time-line" size={16} color="#ffffff" />
                    ) : (
                      <Text style={styles.stepNumber}>{step.id}</Text>
                    )}
                  </View>
                  {index < trackingSteps.length - 1 && (
                    <View style={[
                      styles.stepLine,
                      step.completed && styles.stepLineCompleted,
                      step.active && styles.stepLineActive
                    ]} />
                  )}
                </View>

                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Text style={[
                      styles.stepTitle,
                      (step.completed || step.active) && styles.stepTitleActive
                    ]}>
                      {step.title}
                    </Text>
                    <Text style={[
                      styles.stepTime,
                      (step.completed || step.active) && styles.stepTimeActive
                    ]}>
                      {step.time}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepDescription,
                    (step.completed || step.active) && styles.stepDescriptionActive
                  ]}>
                    {step.description}
                  </Text>
                  {step.active && (
                    <View style={styles.activeIndicator}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>In Progress</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.orderDetailsCard}>
          <Text style={styles.orderDetailsTitle}>Order Details</Text>

          <View style={styles.orderDetailsList}>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Service</Text>
              <Text style={styles.orderDetailValue}>{order.service}</Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Waste Type</Text>
              <Text style={styles.orderDetailValue}>{order.wasteType}</Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Bag Size</Text>
              <Text style={styles.orderDetailValue}>{order.bagSize}</Text>
            </View>
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderDetailLabel}>Pickup Address</Text>
              <Text style={[styles.orderDetailValue, styles.orderDetailValueRight]}>{order.address}</Text>
            </View>
            <View style={styles.orderDetailDivider} />
            <View style={styles.orderDetailRow}>
              <Text style={styles.orderTotalLabel}>Total Amount</Text>
              <Text style={styles.orderTotalValue}>{order.amount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleCallRider}
            style={styles.primaryAction}
          >
            <RemixIcon name="ri-phone-line" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Call Rider</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateTo('/chat-rider')}
            style={styles.secondaryAction}
          >
            <RemixIcon name="ri-chat-3-line" size={20} color="#ffffff" />
            <Text style={styles.secondaryActionText}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleCancelOrder}
          style={styles.cancelButton}
        >
          <RemixIcon name="ri-close-line" size={20} color="#dc2626" />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackOrderPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  liveDotActive: {
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  liveTextActive: {
    color: '#22c55e',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  mapContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mapWrapper: {
    height: 240,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },

  mapOverlay: {
    position: 'absolute',
    top: 28,
    left: 28,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  mapControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  etaText: {
    fontSize: 14,
    color: '#4b5563',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ecfdf5',
  },
  riderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riderCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  riderImageContainer: {
    position: 'relative',
  },
  riderImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  riderStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderDetails: {
    flex: 1,
  },
  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#4b5563',
  },
  riderVehicle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  riderPhone: {
    fontSize: 12,
    color: '#9ca3af',
  },
  riderActions: {
    flexDirection: 'column',
    gap: 8,
  },
  callRiderButton: {
    width: 48,
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatRiderButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  progressSteps: {
    gap: 16,
  },
  progressStep: {
    flexDirection: 'row',
    gap: 16,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
  },
  stepCircleActive: {
    backgroundColor: '#3b82f6',
  },
  stepNumber: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stepLine: {
    width: 2,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  stepLineActive: {
    backgroundColor: '#3b82f6',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  stepTitleActive: {
    color: '#1f2937',
  },
  stepTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stepTimeActive: {
    color: '#4b5563',
  },
  stepDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  stepDescriptionActive: {
    color: '#4b5563',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  activeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  orderDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  orderDetailsList: {
    gap: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  orderDetailValueRight: {
    textAlign: 'right',
  },
  orderDetailDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 12,
    paddingTop: 12,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
});
