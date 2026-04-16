import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { sendLocalNotification } from '../../utils/notifications';
import { navigateTo, navigationRef } from '../../utils/navigation';
import { Alert } from 'react-native';

export const GlobalOrderListener: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const lastStatusRef = useRef<{[key: string]: string}>({});

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    // Global listener for ALL orders - we will filter in JS for maximum reliability
    const channel = supabase.channel(`global-orders-broadcast`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders'
      }, async (payload: any) => {
        const orderId = payload.new.id;
        const newStatus = payload.new.status;
        const targetUserId = payload.new.user_id;
        const targetPhone = payload.new.customer_phone || payload.new.phone;

        // MATCHING LOGIC: Does this order belong to the current user?
        const isMyOrder = targetUserId === user.id || 
                          targetUserId === user.supabase_id ||
                          targetPhone === user.phone_number;

        if (!isMyOrder) return;

        const oldStatus = lastStatusRef.current[orderId];
        if (newStatus === oldStatus) return;
        lastStatusRef.current[orderId] = newStatus;

        console.log(`📦 ORDER SYNC [${orderId.slice(0,5)}]: ${newStatus}`);

        if (['accepted', 'assigned', 'confirmed', 'active'].includes(newStatus)) {
          // Fetch rider name for a personalized message
          const { data: rider } = await supabase.from('riders').select('full_name').eq('id', payload.new.rider_id).single();
          const riderName = rider?.full_name || 'A rider';

          sendLocalNotification(
            'Order Accepted! 🚛',
            `${riderName} has joined your request. Track them now!`,
            { orderId }
          );

          // If user is currently on Home or FindingRider, show a quick alert
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
            'Your waste has been successfully collected. Thank you for choosing BorlaWura!',
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
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isLoggedIn]);

  return null; 
};
