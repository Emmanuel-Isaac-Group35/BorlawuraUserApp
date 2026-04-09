import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { navigateTo } from '../../../utils/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Order {
  id: string;
  type: string;
  date: string;
  status: string;
  rider: string;
}

export const RecentOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

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

        // Fetch rider info separately to avoid join issues
        const riderIds = [...new Set((data || []).map(p => p.rider_id).filter(id => id))];
        let ridersMap: { [key: string]: any } = {};
        
        if (riderIds.length > 0) {
          const { data: ridersData } = await supabase
            .from('riders')
            .select('id, full_name, first_name, last_name')
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
            date: new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            status: p.status === 'pending' ? 'scheduled' : (p.status === 'in_progress' ? 'in-progress' : 'completed'),
            rider: riderName || (p.status === 'completed' ? 'Success' : 'Finding Rider...')
          };
        });
        setOrders(formatted);
      } catch (e) {
        console.error('Error fetching recent orders:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentOrders();

    // Real-time listener
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
          (payload) => {
            console.log('Home screen real-time update:', payload);
            fetchRecentOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#065f46' };
      case 'in-progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'scheduled': return { bg: '#fef3c7', text: '#92400e' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Orders</Text>
        <TouchableOpacity onPress={() => navigateTo('/orders')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.ordersList}>
        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent orders. Start by booking a pickup!</Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColors = getStatusColor(order.status);
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderType}>{order.type}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderFooter}>
                  <Text style={styles.riderText}>Rider: {order.rider}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Montserrat-Bold',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
    fontFamily: 'Montserrat-Medium',
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    fontFamily: 'Montserrat-SemiBold',
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Montserrat-Bold',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riderText: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'Montserrat-Medium',
  },
  amountText: {
    display: 'none',
  },
  emptyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
});
