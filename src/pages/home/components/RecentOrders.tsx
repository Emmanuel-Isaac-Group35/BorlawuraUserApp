import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { navigateTo } from '../../../utils/navigation';

interface Order {
  id: string;
  type: string;
  date: string;
  status: string;
  rider: string;
  amount: string;
}

export const RecentOrders: React.FC = () => {
  const orders: Order[] = [
    {
      id: 'ORD-001',
      type: 'Household Waste',
      date: 'Today, 2:30 PM',
      status: 'completed',
      rider: 'Kwame A.',
      amount: '₵15.00'
    },
    {
      id: 'ORD-002',
      type: 'Recyclables',
      date: 'Yesterday, 10:15 AM',
      status: 'completed',
      rider: 'Ama B.',
      amount: '₵12.00'
    },
    {
      id: 'ORD-003',
      type: 'Organic Waste',
      date: 'Dec 20, 4:45 PM',
      status: 'completed',
      rider: 'Kofi C.',
      amount: '₵10.00'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#065f46' };
      case 'in-progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
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
        {orders.map((order) => {
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
                    Completed
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.riderText}>Rider: {order.rider}</Text>
                <Text style={styles.amountText}>{order.amount}</Text>
              </View>
            </View>
          );
        })}
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
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
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
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riderText: {
    fontSize: 14,
    color: '#4b5563',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
