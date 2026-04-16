import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { sendLocalNotification } from '../../utils/notifications';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { Alert } from 'react-native';

export const GlobalOrderListener: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const lastStatusRef = useRef<{[key: string]: string}>({});
  const pollerRef = useRef<NodeJS.Timeout | null>(null);

  const checkOrdersStatus = async () => {
    if (!isLoggedIn || !user) return;

    try {
      // Fetch active/recent orders for this user using all possible identifiers
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},customer_phone.eq.${user.phone_number},phone.eq.${user.phone_number}`)
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
        // We still use real-time for instant updates if it's enabled
        const order = payload.new;
        const isMyOrder = order.user_id === user.id || 
                          order.customer_phone === user.phone_number ||
                          order.phone === user.phone_number;
        
        if (isMyOrder) {
           const oldStatus = lastStatusRef.current[order.id];
           if (order.status !== oldStatus) {
              processStatusChange(order, order.status);
              lastStatusRef.current[order.id] = order.status;
           }
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
