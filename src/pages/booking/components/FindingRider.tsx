import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { RemixIcon } from '../../../utils/icons';
import { Button } from '../../../components/base/Button';
import { supabase } from '../../../lib/supabase';

const { width, height } = Dimensions.get('window');

const getMapHtml = (userLat: number, userLng: number, riders: any[]) => `
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
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .user-icon {
            background-color: #10b981;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .pulse {
            width: 10px;
            height: 10px;
            background: rgba(16, 185, 129, 0.5);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([${userLat}, ${userLng}], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(map);

        const userIcon = L.divIcon({
            className: 'user-icon',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map);

        const riderIcon = L.divIcon({
            className: 'rider-icon',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const riders = ${JSON.stringify(riders)};
        riders.forEach(rider => {
            L.marker([rider.lat, rider.lng], { icon: riderIcon }).addTo(map);
        });

        // Add a pulsing circle around the user to show searching
        const circle = L.circle([${userLat}, ${userLng}], {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.1,
            radius: 500
        }).addTo(map);

        let radius = 500;
        setInterval(() => {
            radius = radius > 1500 ? 500 : radius + 20;
            circle.setRadius(radius);
        }, 50);
    </script>
</body>
</html>
`;

interface Rider {
  id: string;
  name: string;
  rating: number;
  phone: string;
  photo: string;
  distance: string;
  lat: number;
  lng: number;
}

interface FindingRiderProps {
  userLat: number | null;
  userLng: number | null;
  orderId?: string;
  onRiderFound: (rider: Rider) => void;
  onCancel: () => void;
}

export const FindingRider: React.FC<FindingRiderProps> = ({ userLat, userLng, orderId, onRiderFound, onCancel }) => {
  const [status, setStatus] = useState<'searching' | 'connecting' | 'found'>('searching');
  const [localRider, setLocalRider] = useState<Rider | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [searchAttempt, setSearchAttempt] = useState(0);
  
  // Use provided coordinates or fallback to Accra center
  const lat = userLat || 5.6037;
  const lng = userLng || -0.1870;
  
  // Mock online riders generated relative to user location
  const initialRiders = [
    { id: '1', lat: lat + 0.005, lng: lng + 0.005 },
    { id: '2', lat: lat - 0.005, lng: lng - 0.005 },
    { id: '3', lat: lat + 0.008, lng: lng - 0.004 },
    { id: '4', lat: lat - 0.003, lng: lng + 0.007 },
  ];

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === 'searching') {
      timeoutId = setTimeout(() => {
        Alert.alert(
          'No Riders Available',
          'All riders are currently busy or not available at the moment. Would you like to cancel or keep searching?',
          [
            { 
              text: 'Cancel', 
              onPress: onCancel, 
              style: 'cancel' 
            },
            { 
              text: 'Search Again', 
              onPress: () => setSearchAttempt(prev => prev + 1)
            }
          ]
        );
      }, 3 * 60 * 1000); // 3 minutes
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [status, searchAttempt, onCancel]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (!orderId) {
      console.warn("FindingRider: No orderId provided, cannot listen for rider changes.");
      return;
    }

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async (payload: any) => {
          console.log('Order status update in FindingRider:', payload);
          const updatedOrder = payload.new;
          if (updatedOrder.status === 'accepted' || updatedOrder.rider_id) {
            
            // Try fetching from riders table
            const { data: riderData, error } = await supabase
              .from('riders')
              .select('*')
              .eq('id', updatedOrder.rider_id)
              .single();

            if (error) {
              console.error("Error fetching rider details in FindingRider:", error);
            }

            const riderPhone = riderData?.phone_number || riderData?.phone || '+233 24 000 0000';
            const riderName = riderData?.full_name || (riderData?.first_name ? `${riderData.first_name} ${riderData.last_name || ''}`.trim() : 'Your Rider');
            const riderPhoto = riderData?.avatar_url || 'https://readdy.ai/api/search-image?query=Professional%20African%20male%20waste%20collection%20worker%2C%20friendly%20smile%2C%20uniform%2C%20safety%20equipment%2C%20confident%20expression%2C%20clean%20background%2C%20high-quality%20portrait%20photography&width=100&height=100&seq=rider_found&orientation=squarish';

            const rating = riderData?.rating ? parseFloat(riderData.rating) : 5.0;

            const realRider: Rider = {
              id: updatedOrder.rider_id || 'RDR-001',
              name: riderName,
              rating: rating,
              phone: riderPhone,
              photo: riderPhoto,
              distance: 'On the way',
              lat: riderData?.latitude || lat + 0.002,
              lng: riderData?.longitude || lng + 0.002
            };

            setLocalRider(realRider);
            setStatus('connecting');
            setTimeout(() => {
              setStatus('found');
              setTimeout(() => onRiderFound(realRider), 1500);
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: getMapHtml(lat, lng, initialRiders) }}
          style={styles.map}
          scrollEnabled={false}
        />
        <View style={styles.overlay}>
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>
              {status === 'searching' ? 'Searching for riders...' : 
               status === 'connecting' ? 'Connecting to rider...' : 
               'Rider found!'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        {status !== 'found' ? (
          <View style={styles.loadingContent}>
            <Animated.View style={[styles.searchingIcon, { transform: [{ scale: pulseAnim }] }]}>
              <RemixIcon name="ri-radar-line" size={40} color="#10b981" />
            </Animated.View>
            <Text style={styles.title}>Finding Your Rider</Text>
            <Text style={styles.subtitle}>
              Connecting you with the nearest Borla Wura rider for quick pickup
            </Text>
            <View style={styles.tipCard}>
              <RemixIcon name="ri-lightbulb-line" size={18} color="#065f46" />
              <Text style={styles.tipText}>
                Did you know? Sorting your waste helps our riders process it faster!
              </Text>
            </View>
            <Button variant="outline" onPress={onCancel} fullWidth style={styles.cancelBtn}>
              Cancel Search
            </Button>
          </View>
        ) : (
          <View style={styles.foundContent}>
            <View style={styles.foundHeader}>
              <RemixIcon name="ri-checkbox-circle-fill" size={24} color="#10b981" />
              <Text style={styles.foundTitle}>Rider Accepted!</Text>
            </View>
            <View style={styles.riderInfo}>
              {localRider && (
                <>
                  <Image source={{ uri: localRider.photo }} style={styles.riderPhoto} />
                  <View style={styles.riderDetails}>
                    <Text style={styles.riderName}>{localRider.name}</Text>
                    <View style={styles.ratingRow}>
                      <RemixIcon name="ri-star-fill" size={14} color="#fbbf24" />
                      <Text style={styles.ratingText}>{localRider.rating}</Text>
                      <View style={styles.dot} />
                      <Text style={styles.distanceText}>{localRider.distance}</Text>
                    </View>
                  </View>
                </>
              )}
              <View style={styles.riderActions}>
                <View style={styles.actionIcon}>
                  <RemixIcon name="ri-phone-line" size={20} color="#10b981" />
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loadingContent: {
    alignItems: 'center',
  },
  searchingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    lineHeight: 18,
  },
  cancelBtn: {
    borderColor: '#ef4444',
  },
  foundContent: {
    gap: 20,
  },
  foundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  riderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  riderActions: {
    gap: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
