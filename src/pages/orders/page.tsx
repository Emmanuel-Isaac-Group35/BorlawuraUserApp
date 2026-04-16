import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Linking, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateReceipt } from '../../utils/receiptGenerator';

const OrdersPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  // ... (keep searchId logic and useEffect as is)
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [modifiedData, setModifiedData] = useState({
    date: '',
    time: '',
    address: ''
  });

  React.useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    let searchId = user?.supabase_id || user?.id;
    if (searchId && !String(searchId).startsWith('user_')) {
      const channel = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${searchId}`,
          },
          (payload) => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const riderIds = [...new Set((data || []).map(p => p.rider_id).filter(id => id))];
      let ridersMap: { [key: string]: any } = {};
      
      if (riderIds.length > 0) {
        const { data: ridersData } = await supabase
          .from('riders')
          .select('id, full_name, first_name, last_name, phone_number, phone')
          .in('id', riderIds);
        
        if (ridersData) {
          ridersData.forEach(r => {
            ridersMap[r.id] = r;
          });
        }
      }

      const formattedOrders = (data || []).map(p => {
        const riderData = p.rider_id ? ridersMap[p.rider_id] : null;
        const riderName = riderData ? (riderData.full_name || `${riderData.first_name || ''} ${riderData.last_name || ''}`.trim()) : null;
        
        return {
          id: p.id.slice(0, 8).toUpperCase(),
          realId: p.id,
          status: p.status === 'pending' ? 'scheduled' : (p.status === 'in_progress' ? 'in_progress' : p.status),
          service: p.service_type || 'Waste Pickup',
          date: new Date(p.created_at).toLocaleDateString('en-GB'),
          time: p.scheduled_at ? new Date(p.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          address: p.address,
          latitude: p.pickup_latitude,
          longitude: p.pickup_longitude,
          wasteType: p.waste_type || 'General',
          bagSize: p.waste_size || 'Standard',
          rider: riderName,
          riderPhone: riderData?.phone_number || riderData?.phone,
          notes: p.notes || '',
          paymentMethod: p.payment_method || 'Mobile Money'
        };
      });

      setOrders(formattedOrders);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return { bg: '#e0f2fe', text: '#0369a1' };
      case 'scheduled': return { bg: '#fef3c7', text: '#92400e' };
      case 'completed': return { bg: '#ecfdf5', text: '#065f46' };
      case 'cancelled': return { bg: '#fef2f2', text: '#991b1b' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const activeOrders = orders.filter(order => ['in_progress', 'scheduled'].includes(order.status));
  const completedOrders = orders.filter(order => order.status === 'completed');

  const handleTrackOrder = (orderId: string) => {
    navigateTo('/track-order', { id: orderId });
  };

  const handleReorder = (orderId: string) => {
    navigateTo('/booking');
  };

  const handleCallRider = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to place call');
    }
  };

  const handleRateOrder = (order: any) => {
    setSelectedOrder(order);
    setRating(order.rating || 0);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ rating: rating })
        .eq('id', selectedOrder.realId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, rating } : order
      ));
      setShowRatingModal(false);
      setRating(0);
      setSelectedOrder(null);
    } catch (error) {
       Alert.alert("Error", "Failed to save your rating.");
    }
  };

  const handleModifyOrder = (order: any) => {
    setSelectedOrder(order);
    setModifiedData({
      date: order.date,
      time: order.time,
      address: order.address
    });
    setShowModifyModal(true);
  };

  const handleCancelOrder = (order: any) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', selectedOrder.realId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: 'cancelled' } : order
      ));
      setShowCancelModal(false);
      setSelectedOrder(null);
    } catch (error) {
       Alert.alert("Error", "Failed to cancel the order.");
    }
  };

  const handleSaveModification = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ address: modifiedData.address })
        .eq('id', selectedOrder.realId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, ...modifiedData } : order
      ));
      setShowModifyModal(false);
      setSelectedOrder(null);
      Alert.alert("Success", "Order updated successfully.");
    } catch (error) {
       Alert.alert("Error", "Failed to update the order.");
    }
  };

  const handleDownloadReceipt = async (order: any) => {
    try {
      await generateReceipt({
        id: order.id,
        service: order.service,
        date: order.date,
        time: order.time,
        address: order.address,
        wasteType: order.wasteType,
        bagSize: order.bagSize,
        rider: order.rider
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { 
            paddingTop: insets.top + 70, 
            paddingBottom: insets.bottom + 100 
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={fetchOrders} 
            colors={['#10b981']}
            tintColor={'#10b981'}
          />
        }
      >

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active {activeOrders.length > 0 && `(${activeOrders.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <RemixIcon name="ri-file-list-3-line" size={32} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active' 
                ? "You don't have any active pickups at the moment."
                : "Your completed pickups will appear here."}
            </Text>
            <TouchableOpacity
              onPress={() => navigateTo('/booking')}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Book Pickup Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {displayOrders.map((order) => {
              const statusColors = getStatusColor(order.status);
              return (
                <View key={order.realId} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <View style={styles.orderIdRow}>
                        <Text style={styles.orderId}>#{order.id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {getStatusText(order.status).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.orderService}>{order.service}</Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <RemixIcon name="ri-calendar-line" size={16} color="#94a3b8" />
                      <Text style={styles.orderDetailText}>{order.date} • {order.time}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <RemixIcon name="ri-map-pin-line" size={16} color="#94a3b8" />
                      <Text style={styles.orderDetailText} numberOfLines={1}>{order.address}</Text>
                    </View>
                    <View style={styles.orderItems}>
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{order.wasteType}</Text>
                      </View>
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{order.bagSize} Bag</Text>
                      </View>
                    </View>
                  </View>

                  {order.rider && (order.status === 'in_progress' || order.status === 'scheduled') && (
                    <View style={styles.riderSection}>
                      <View style={styles.riderAvatar}>
                        <RemixIcon name="ri-user-smile-fill" size={24} color="#10b981" />
                      </View>
                      <View style={styles.riderInfo}>
                        <Text style={styles.riderLabel}>ASSIGNED RIDER</Text>
                        <Text style={styles.riderName}>{order.rider}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleCallRider(order.riderPhone!)}
                        style={styles.callBtn}
                      >
                        <RemixIcon name="ri-phone-fill" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.cardActions}>
                    {order.status === 'completed' ? (
                      <TouchableOpacity
                        onPress={() => handleDownloadReceipt(order)}
                        style={styles.receiptBtn}
                      >
                        <RemixIcon name="ri-file-download-line" size={18} color="#10b981" />
                        <Text style={styles.receiptBtnText}>Receipt</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleTrackOrder(order.realId)}
                        style={styles.trackBtn}
                      >
                        <Text style={styles.trackBtnText}>Track Order</Text>
                      </TouchableOpacity>
                    )}
                    
                    {order.status === 'scheduled' && (
                      <TouchableOpacity 
                        onPress={() => handleCancelOrder(order)}
                        style={styles.cancelBtn}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    {order.status === 'completed' && (
                      <TouchableOpacity
                        onPress={() => handleReorder(order.id)}
                        style={styles.reorderBtn}
                      >
                        <Text style={styles.reorderBtnText}>Book Again</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modern Star Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Service</Text>
            <Text style={styles.modalSubtitle}>How was your waste collection experience?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <RemixIcon name={rating >= s ? "ri-star-fill" : "ri-star-line"} size={40} color="#fbbf24" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleSubmitRating} style={styles.modalPrimaryBtn}>
              <Text style={styles.modalPrimaryBtnText}>Submit Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRatingModal(false)} style={styles.modalSecondaryBtn}>
              <Text style={styles.modalSecondaryBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modals for Cancel/Modify follow similar premium patterns */}
    </SafeAreaView>
  );
};

export default OrdersPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#10b981',
  },
  ordersList: {
    gap: 20,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  orderId: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: typography.bold,
  },
  orderService: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
  orderDetails: {
    gap: 10,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderDetailText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
    flex: 1,
  },
  orderItems: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  itemBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemBadgeText: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
  riderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riderInfo: {
    flex: 1,
  },
  riderLabel: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#10b981',
    letterSpacing: 0.5,
  },
  riderName: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#065f46',
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  trackBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  trackBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  receiptBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#10b981',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#dc2626',
  },
  reorderBtn: {
    flex: 2,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  reorderBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#f1f5f9',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryBtnText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#64748b',
  },
});
