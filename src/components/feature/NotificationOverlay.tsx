import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, Modal } from 'react-native';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { navigateTo } from '../../utils/navigation';

export const NotificationOverlay: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [riderInfo, setRiderInfo] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const userId = user.supabase_id || user.id;
    if (!userId || userId.toString().startsWith('user_')) return;

    const channel = supabase.channel(`global-notifications-${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `user_id=eq.${userId}` 
      }, async (payload: any) => {
          // If a rider was just assigned (accepted)
          if (payload.new.status === 'accepted' && payload.old.status === 'pending') {
            const { data: rider } = await supabase
              .from('riders')
              .select('*')
              .eq('id', payload.new.rider_id)
              .single();
            
            if (rider) {
              setRiderInfo(rider);
              setOrderId(payload.new.id);
              setVisible(true);
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8
              }).start();

              // Auto-hide after 10 seconds
              setTimeout(() => hide(), 10000);
            }
          }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isLoggedIn]);

  const hide = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => setVisible(false));
  };

  const handleTrack = () => {
    if (orderId) {
      navigateTo('/track-order', { id: orderId });
      hide();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.successIcon}>
              <RemixIcon name="ri-check-line" size={24} color="#fff" />
            </View>
            <Text style={styles.title}>Rider Assigned!</Text>
            <TouchableOpacity onPress={hide} style={styles.closeBtn}>
              <RemixIcon name="ri-close-line" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Image 
              source={{ uri: riderInfo?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
              style={styles.avatar} 
            />
            <View style={styles.info}>
              <Text style={styles.name}>{riderInfo?.full_name || 'Borla Rider'}</Text>
              <Text style={styles.desc}>Has accepted your pickup request and is heading your way.</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleTrack} style={styles.actionBtn}>
            <Text style={styles.actionText}>Track Live</Text>
            <RemixIcon name="ri-arrow-right-line" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#1e293b',
    marginBottom: 2,
  },
  desc: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#64748b',
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 18,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#fff',
  },
});
