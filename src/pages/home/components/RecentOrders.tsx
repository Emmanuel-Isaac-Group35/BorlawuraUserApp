import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      if (!user) return;
      setIsLoading(true);
      try {
        let searchId = user.supabase_id || user.id;
        if (searchId && String(searchId).startsWith('user_')) {
          let searchPhone = (user.phone_number || user.phoneNumber || '').replace(/\s+/g, '');
          if (searchPhone.startsWith('0')) {
            searchPhone = '+233' + searchPhone.substring(1);
          } else if (searchPhone && !searchPhone.startsWith('+')) {
            searchPhone = '+233' + searchPhone;
          }
          const searchEmail = user.email && user.email.includes('@') ? user.email : null;
          
          let query = supabase.from('users').select('id');
          if (searchPhone && searchEmail) {
            query = query.or(`phone_number.eq.${searchPhone},email.eq.${searchEmail}`);
          } else if (searchPhone) {
            query = query.eq('phone_number', searchPhone);
          } else if (searchEmail) {
            query = query.eq('email', searchEmail);
          }
          
          const { data: dbUser } = await query.single();
          if (dbUser) searchId = dbUser.id;
        }

        if (!searchId || String(searchId).startsWith('user_')) {
          setIsLoading(false);
          return;
        }
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

    let searchId = user?.supabase_id || user?.id;
    if (searchId && !String(searchId).startsWith('user_')) {
      const channel = supabase
        .channel('recent-order-updates')
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

      return () => {
        supabase.removeChannel(channel);
      };
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={() => navigateTo('/orders')}>
          <Text style={styles.viewAll}>See All</Text>
        </TouchableOpacity>
      </View>
      
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
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <RemixIcon name={order.icon} size={20} color="#64748b" />
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={styles.orderType}>{order.type}</Text>
                  <Text style={styles.orderSubtext}>{order.date} • {order.time}</Text>
                </View>

                <View style={styles.statusBox}>
                  <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                  <Text style={styles.statusLabel}>{status.label}</Text>
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
    paddingHorizontal: 20,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  viewAll: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#10b981',
  },
  ordersList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderType: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#1e293b',
  },
  orderSubtext: {
    fontSize: 12,
    fontFamily: typography.regular,
    color: '#64748b',
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginTop: 10,
  },
});
