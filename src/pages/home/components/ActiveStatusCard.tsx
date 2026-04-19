import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

export const ActiveStatusCard: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [impactStats, setImpactStats] = useState({ current: 0, goal: 1000 });
  const isMounted = React.useRef(true);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .eq('user_id', user.supabase_id || user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (isMounted.current) {
        setActiveOrder(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };

    const fetchStats = async () => {
      // In a real app, this would be a rollup or stats table
      // Here we simulate by counting completed orders
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      if (isMounted.current) {
        // Assume average 15kg per order for simulation
        const totalKg = (count || 0) * 15;
        setImpactStats({ current: Math.min(totalKg, 1000), goal: 1000 });
      }
    };

    fetchActiveOrder();
    fetchStats();
    
    // Subscribe to changes
    const channel = supabase.channel('home-status-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchActiveOrder();
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.impactCard}
          onPress={() => navigateTo('/services')}
          activeOpacity={0.8}
        >
          <View style={styles.impactContent}>
            <View style={styles.iconBox}>
              <RemixIcon name="ri-shield-check-fill" size={24} color="#10b981" />
            </View>
            <View style={styles.impactText}>
              <Text style={styles.impactTitle}>Eco-Friendly & Secure</Text>
              <Text style={styles.impactSub}>Your pickups are processed with zero-waste goals in mind.</Text>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const isLive = activeOrder.status === 'in_progress';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity 
        style={[styles.statusCard, isLive ? styles.liveCard : styles.pendingCard]}
        onPress={() => navigateTo('/track-order', { id: activeOrder.id })}
        activeOpacity={0.85}
      >
        <View style={styles.statusHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.liveBadge, { backgroundColor: isLive ? 'rgba(255,255,255,0.2)' : '#f8fafc' }]}>
              <View style={[styles.dot, { backgroundColor: isLive ? '#ffffff' : '#10b981' }]} />
              <Text style={[styles.badgeText, { color: isLive ? '#ffffff' : '#64748b' }]}>
                {isLive ? 'LIVE TRACKING' : 'ORDER PENDING'}
              </Text>
            </View>
          </View>
          <RemixIcon name="ri-arrow-right-up-line" size={18} color={isLive ? '#fff' : '#64748b'} />
        </View>

        <Text style={[styles.mainMsg, { color: isLive ? '#fff' : '#0f172a' }]}>
          {isLive ? 'Rider heading to you!' : 'Collection Request Sent'}
        </Text>
        
        <Text style={[styles.subMsg, { color: isLive ? 'rgba(255,255,255,0.7)' : '#64748b' }]}>
          {isLive ? 'Estimated arrival in 12-15 mins' : `Collecting from: ${activeOrder.address}`}
        </Text>

        <View style={[styles.footer, isLive && { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={styles.riderBtn}>
            <Text style={[styles.btnText, { color: isLive ? '#fff' : '#10b981' }]}>Open Tracker</Text>
            <RemixIcon name="ri-arrow-right-line" size={16} color={isLive ? '#fff' : '#10b981'} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  impactCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  impactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f1fef8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  impactText: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  impactSub: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 18,
  },
  statusCard: {
    padding: 24,
    borderRadius: 30,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  liveCard: {
    backgroundColor: '#10b981',
  },
  pendingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainMsg: {
    fontSize: 22,
    fontFamily: typography.bold,
    marginBottom: 6,
    letterSpacing: -0.8,
  },
  subMsg: {
    fontSize: 14,
    fontFamily: typography.medium,
    lineHeight: 22,
    marginBottom: 20,
  },
  footer: {
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  riderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 15,
    fontFamily: typography.bold,
  },
});
