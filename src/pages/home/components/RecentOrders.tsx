import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

import { resolveRealUserId } from '../../../utils/user';

// LayoutAnimation is handled automatically in the new architecture
// No manual configuration needed for Android here.

interface Order {
  id: string;
  type: string;
  date: string;
  time: string;
  status: string;
  rider: string;
  icon: string;
}

export const RecentOrders: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  React.useEffect(() => {
    const fetchRecentOrders = async () => {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', searchId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const riderIds = [...new Set((data || []).map(p => p.rider_id).filter(id => id))];
        let ridersMap: { [key: string]: any } = {};
        
        if (riderIds.length > 0) {
          const { data: ridersData } = await supabase
            .from('riders')
            .select('id, full_name, first_name, last_name, avatar_url')
            .in('id', riderIds);
          
          if (ridersData) {
            ridersData.forEach(r => {
              ridersMap[r.id] = r;
            });
          }
        }

        const formatted = (data || []).map(p => {
          const riderData = p.rider_id ? ridersMap[p.rider_id] : null;
          const riderName = riderData ? (riderData.full_name || `${riderData.first_name || ''} ${riderData.last_name || ''}`.trim()) : null;
          
          return {
            id: p.id,
            type: p.service_type || 'Waste Pickup',
            date: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            time: new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            status: p.status === 'pending' ? 'scheduled' : (p.status === 'in_progress' ? 'in-progress' : 'completed'),
            rider: riderName || (p.status === 'completed' ? 'Success' : 'Finding Rider...'),
            icon: (p.service_type || '').toLowerCase().includes('instant') ? 'ri-flashlight-fill' : 'ri-calendar-event-fill'
          };
        });
        if (isMounted.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOrders(formatted);
        }
      } catch (e) {
        console.error('Error fetching recent orders:', e);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    fetchRecentOrders();

    const setupSubscription = async () => {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;

      const channel = supabase
        .channel(`recent-orders-${searchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${searchId}`,
          },
          () => fetchRecentOrders()
        )
        .subscribe();

      return channel;
    };

    let subChannel: any;
    setupSubscription().then(ch => { subChannel = ch; });

    return () => {
      if (subChannel) supabase.removeChannel(subChannel);
    };
  }, [user]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#f1f5f9', dot: '#10b981', text: '#334155', label: 'Completed' };
      case 'in-progress': return { bg: '#f1f5f9', dot: '#3b82f6', text: '#334155', label: 'In Transit' };
      default: return { bg: '#f1f5f9', dot: '#f59e0b', text: '#334155', label: 'Pending' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ordersList}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <RemixIcon name="ri-inbox-line" size={32} color="#94a3b8" />
            <Text style={styles.emptyText}>No recent activities yet</Text>
          </View>
        ) : (
          orders.map((order) => {
            const status = getStatusStyle(order.status);
            return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderItem}
                onPress={() => navigateTo('/track-order', { id: order.id })}
                activeOpacity={0.75}
              >
                <View style={styles.iconBox}>
                  <RemixIcon name={order.icon} size={22} color="#10b981" />
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={styles.orderType}>{order.type}</Text>
                  <Text style={styles.orderSubtext}>{order.date} • {order.time}</Text>
                </View>
 
                <View style={[styles.statusBox, { backgroundColor: status.dot + '10' }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                  <Text style={[styles.statusLabel, { color: status.dot }]}>{status.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
});
 
const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 40,
  },
  ordersList: {
    gap: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
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
  orderInfo: {
    flex: 1,
  },
  orderType: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  orderSubtext: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#f1f5f9',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#94a3b8',
    marginTop: 12,
  },
});
