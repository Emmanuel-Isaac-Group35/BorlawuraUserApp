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
          activeOpacity={0.9}
        >
          <View style={styles.impactContent}>
            <View style={styles.impactIcon}>
              <RemixIcon name="ri-leaf-fill" size={24} color="#059669" />
            </View>
            <View style={styles.impactText}>
              <Text style={styles.impactTitle}>Community Impact</Text>
              <Text style={styles.impactSub}>{Math.round(impactStats.current)}kg collected of {impactStats.goal}kg goal</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(impactStats.current / impactStats.goal) * 100}%` }]} />
              </View>
            </View>
            <RemixIcon name="ri-arrow-right-s-line" size={20} color="#059669" />
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
        activeOpacity={0.9}
      >
        <View style={styles.statusHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.liveBadge, { backgroundColor: isLive ? '#ffffff' : '#fef3c7' }]}>
              <View style={[styles.dot, { backgroundColor: isLive ? '#10b981' : '#f59e0b' }]} />
              <Text style={[styles.badgeText, { color: isLive ? '#10b981' : '#92400e' }]}>
                {isLive ? 'LIVE TRACKING' : 'SCHEDULED'}
              </Text>
            </View>
          </View>
          <RemixIcon name="ri-share-forward-box-line" size={20} color={isLive ? '#fff' : '#64748b'} />
        </View>

        <Text style={[styles.mainMsg, { color: isLive ? '#fff' : '#1e293b' }]}>
          {isLive ? 'Your Rider is on the way!' : 'Scheduled for Collection'}
        </Text>
        
        <Text style={[styles.subMsg, { color: isLive ? 'rgba(255,255,255,0.8)' : '#64748b' }]}>
          {isLive ? 'Estimated arrival in 12-15 mins' : `${activeOrder.service_type} at ${activeOrder.address}`}
        </Text>

        <View style={styles.footer}>
          <View style={styles.riderBtn}>
            <Text style={[styles.btnText, { color: isLive ? '#fff' : '#10b981' }]}>Track Now</Text>
            <RemixIcon name="ri-arrow-right-line" size={16} color={isLive ? '#fff' : '#10b981'} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  impactCard: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  impactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  impactText: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#065f46',
  },
  impactSub: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#047857',
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderRadius: 3,
    marginTop: 8,
    width: '90%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  statusCard: {
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  liveCard: {
    backgroundColor: '#10b981',
  },
  pendingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.bold,
  },
  mainMsg: {
    fontSize: 20,
    fontFamily: typography.bold,
    marginBottom: 4,
  },
  subMsg: {
    fontSize: 14,
    fontFamily: typography.medium,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 12,
  },
  riderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 14,
    fontFamily: typography.bold,
  },
});
