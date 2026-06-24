import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { sendLocalNotification } from '../../utils/notifications';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { Alert, Vibration, Platform } from 'react-native';
import Constants from 'expo-constants';

export const GlobalOrderListener: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const lastStatusRef = useRef<{[key: string]: string}>({});
  const notified5MinRef = useRef<{[key: string]: boolean}>({});
  const pollerRef = useRef<NodeJS.Timeout | null>(null);

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkProximityWarning = (order: any) => {
    if (!['accepted', 'assigned', 'active', 'in_progress', 'heading'].includes(order.status?.toLowerCase())) return;
    if (notified5MinRef.current[order.id]) return;

    const rLat = parseFloat(order.rider_lat);
    const rLng = parseFloat(order.rider_lng);
    const pLat = parseFloat(order.pickup_latitude);
    const pLng = parseFloat(order.pickup_longitude);

    if (Number.isFinite(rLat) && Number.isFinite(pLat) && Number.isFinite(rLng) && Number.isFinite(pLng)) {
      const dist = getDistanceMeters(pLat, pLng, rLat, rLng);
      // If within ~1.65km (approx 5 mins at typical city speeds)
      if (dist > 0 && dist < 1650) {
        notified5MinRef.current[order.id] = true;
        sendLocalNotification(
          'Rider Nearby! ⏱️',
          'Your rider is about 5 minutes away from your location.',
          { orderId: order.id }
        );
      }
    }
  };

  const checkOrdersStatus = async () => {
    if (!isLoggedIn || !user) return;

    try {
      // Fetch active/recent orders for this user using all possible identifiers
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['accepted', 'assigned', 'active', 'confirmed', 'in_progress', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) {
        console.log('Poller error:', error.message);
        return;
      }

      if (!orders) return;

      for (const order of orders) {
        const orderId = order.id;
        const newStatus = order.status;
        const oldStatus = lastStatusRef.current[orderId];

        // If status is new, trigger notification/alert
        if (newStatus !== oldStatus && oldStatus !== undefined) {
          processStatusChange(order, newStatus);
        }
        
        checkProximityWarning(order);
        
        // Always update the ref for the first run or changes
        lastStatusRef.current[orderId] = newStatus;
      }
    } catch (err) {
      console.log('Global poll failed:', err);
    }
  };

  const processStatusChange = async (order: any, newStatus: string) => {
    const orderId = order.id;
    console.log(`📡 Status Change Detected: ${orderId.slice(0, 8)} -> ${newStatus}`);

    if (['accepted', 'assigned', 'confirmed', 'active'].includes(newStatus)) {
      const { data: rider } = await supabase.from('riders').select('full_name').eq('id', order.rider_id).single();
      const riderName = rider?.full_name || 'A rider';

      sendLocalNotification(
        'Order Accepted! 🚛',
        `${riderName} is on the way to your location.`,
        { orderId }
      );

      const currentRoute = navigationRef.getCurrentRoute()?.name;
      if (currentRoute === 'Home' || currentRoute === 'Booking') {
        Alert.alert(
          "Rider Found!",
          `${riderName} is on the way. Would you like to track your pickup?`,
          [
            { text: "Later", style: "cancel" },
            { text: "Track Now", onPress: () => navigateTo('/track-order', { id: orderId }) }
          ]
        );
      }
    } else if (newStatus === 'arrived') {
      const { data: rider } = await supabase.from('riders').select('full_name').eq('id', order.rider_id).single();
      const riderName = rider?.full_name || 'Your rider';

      sendLocalNotification(
        'Rider Arrived! 🔔',
        `${riderName} has arrived at your location for the pickup.`,
        { orderId }
      );

      // Persistent vibration for immediate arrival awareness
      const pattern = Platform.OS === 'android' ? [0, 1000, 500, 1000, 500, 1000] : [0, 1000, 500, 1000, 500, 1000];
      Vibration.vibrate(pattern);

      Alert.alert(
        "Rider Arrived!",
        `${riderName} is now at your location. Please head out for the collection.`,
        [
          { text: "I'm Coming!", onPress: () => navigateTo('/track-order', { id: orderId }) }
        ]
      );
    } else if (newStatus === 'completed') {
      sendLocalNotification(
        'Pickup Completed! ✅',
        'Your waste has been successfully collected. Thank you!',
        { orderId }
      );

      Alert.alert(
        "Collection Finished!",
        "Your waste has been successfully collected. We hope you're happy with the service!",
        [
          { text: "Great!", onPress: () => navigateTo('/orders') }
        ]
      );
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      if (pollerRef.current) clearInterval(pollerRef.current);
      return;
    }

    // 1. Initial Check on Mount
    checkOrdersStatus();

    // 2. Real-time Subscription (Instant fallback)
    const channel = supabase.channel('global-orders-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new;
        const isMyOrder = order.user_id === user.id;
        
        if (isMyOrder) {
           const oldStatus = lastStatusRef.current[order.id];
           if (order.status !== oldStatus) {
              processStatusChange(order, order.status);
              lastStatusRef.current[order.id] = order.status;
           }
           checkProximityWarning(order);
        }
      }).subscribe();

    // 3. Heartbeat Poller (Fail-safe backup every 7 seconds)
    pollerRef.current = setInterval(checkOrdersStatus, 7000);

    return () => {
      supabase.removeChannel(channel);
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [user?.id, isLoggedIn]);

  return null;
};
