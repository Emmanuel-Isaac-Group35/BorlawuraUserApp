import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Linking, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateReceipt } from '../../utils/receiptGenerator';

import { resolveRealUserId } from '../../utils/user';

const OrdersPage: React.FC = () => {
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    fetchOrders();

    const setupSubscription = async () => {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;

      const channel = supabase
        .channel(`orders-${searchId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${searchId}` },
          () => fetchOrders()
        )
        .subscribe();

      return channel;
    };

    let subChannel: any;
    setupSubscription().then(ch => { subChannel = ch; });

    return () => { if (subChannel) supabase.removeChannel(subChannel); };
  }, [user]);

  const fetchOrders = async () => {
    const searchId = await resolveRealUserId(user);
    if (!searchId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', searchId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const riderIds = [...new Set((data || []).map(p => p.rider_id).filter(id => id))];
      let ridersMap: { [key: string]: any } = {};
      if (riderIds.length > 0) {
        const { data: ridersData } = await supabase.from('riders').select('id, full_name, phone_number').in('id', riderIds);
        if (ridersData) ridersData.forEach(r => { ridersMap[r.id] = r; });
      }

      const formattedOrders = (data || []).map(p => ({
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
        rider: ridersMap[p.rider_id]?.full_name || null,
        riderPhone: ridersMap[p.rider_id]?.phone_number || null,
        notes: p.notes || ''
      }));

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

  const activeOrders = orders.filter(order => ['in_progress', 'active', 'accepted', 'assigned', 'confirmed', 'scheduled'].includes(order.status));
  const historyOrders = orders.filter(order => ['completed', 'cancelled'].includes(order.status));

  const handleTrackOrder = (orderId: string) => navigateTo('/track-order', { id: orderId });
  const handleReorder = () => navigateTo('/booking');
  const handleCallRider = (phone: string) => Linking.openURL(`tel:${phone}`);
  
  const handleModifyOrder = (order: any) => {
    setSelectedOrder(order);
    setModifiedData({ date: order.date, time: order.time, address: order.address });
    setShowModifyModal(true);
  };

  const handleCancelOrder = (order: any) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      const { error } = await supabase.from('orders').update({ 
        status: 'cancelled', 
        sub_status: 'cancelled', 
        cancelled_at: new Date().toISOString() 
      }).eq('id', selectedOrder.realId);

      if (error) {
        console.error("Cancel Error:", error);
        Alert.alert("Failed to Cancel", `Database Error: ${error.message} (${error.code})`);
        return;
      }

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o));
      setShowCancelModal(false);
      Alert.alert("Success", "Your order has been cancelled.");
    } catch (e: any) { 
      Alert.alert("Error", "Communication failure. Please try again."); 
    }
  };

  const handleSaveModification = async () => {
    if (!selectedOrder) return;
    try {
      const { error } = await supabase.from('orders').update({ address: modifiedData.address }).eq('id', selectedOrder.realId);
      if (error) throw error;
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, address: modifiedData.address } : o));
      setShowModifyModal(false);
      Alert.alert("Success", "Updated successfully.");
    } catch (error) { Alert.alert("Error", "Failed to update."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchOrders} colors={['#10b981']} />}
      >
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('active')} style={[styles.tab, activeTab === 'active' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active ({activeOrders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History ({historyOrders.length})</Text>
          </TouchableOpacity>
        </View>

        {(activeTab === 'active' ? activeOrders : historyOrders).map((order) => {
          const colors = getStatusColor(order.status);
          return (
            <View key={order.realId} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.text }]}>{getStatusText(order.status).toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.orderService}>{order.service}</Text>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}><RemixIcon name="ri-calendar-line" size={16} color="#94a3b8" /><Text style={styles.orderDetailText}>{order.date} • {order.time}</Text></View>
                <View style={styles.orderDetailRow}><RemixIcon name="ri-map-pin-line" size={16} color="#94a3b8" /><Text style={styles.orderDetailText} numberOfLines={1}>{order.address}</Text></View>
              </View>

              <View style={styles.cardActions}>
                {['in_progress', 'active', 'accepted', 'assigned', 'confirmed'].includes(order.status) ? (
                  <TouchableOpacity onPress={() => handleTrackOrder(order.realId)} style={styles.trackBtn}>
                    <Text style={styles.trackBtnText}>Track Order</Text>
                  </TouchableOpacity>
                ) : order.status === 'scheduled' ? (
                  <TouchableOpacity onPress={() => handleModifyOrder(order)} style={styles.modifyBtn}>
                    <Text style={styles.modifyBtnText}>Modify Pickup</Text>
                  </TouchableOpacity>
                ) : null}

                {order.status === 'scheduled' && (
                  <TouchableOpacity onPress={() => handleCancelOrder(order)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                
                {order.status === 'completed' && (
                  <TouchableOpacity onPress={handleReorder} style={styles.reorderBtn}>
                    <Text style={styles.reorderBtnText}>Book Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modals */}
      <Modal visible={showModifyModal} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}><View style={styles.modalContentBottom}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Modify Pickup</Text><TouchableOpacity onPress={() => setShowModifyModal(false)}><RemixIcon name="ri-close-line" size={24} color="#0f172a" /></TouchableOpacity></View>
          <View style={styles.form}>
            <Text style={styles.formLabel}>Collection Address</Text>
            <TextInput style={styles.formInput} value={modifiedData.address} onChangeText={(t) => setModifiedData({...modifiedData, address: t})} multiline />
            <TouchableOpacity onPress={handleSaveModification} style={styles.modalPrimaryBtn}><Text style={styles.modalPrimaryBtnText}>Save Changes</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.cancelIconBox}><RemixIcon name="ri-error-warning-fill" size={32} color="#ef4444" /></View>
          <Text style={styles.modalTitle}>Cancel Pickup?</Text>
          <Text style={styles.modalSubtitle}>This request will be permanently cancelled.</Text>
          <TouchableOpacity onPress={confirmCancelOrder} style={styles.modalDangerBtn}><Text style={styles.modalDangerBtnText}>Yes, Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCancelModal(false)} style={styles.modalSecondaryBtn}><Text style={styles.modalSecondaryBtnText}>No, Keep It</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  tabs: { 
    flexDirection: 'row', 
    backgroundColor: '#f8fafc', 
    borderRadius: 18, 
    padding: 6, 
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  tabActive: { 
    backgroundColor: '#ffffff', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3 
  },
  tabText: { fontSize: 14, fontFamily: typography.semiBold, color: '#64748b' },
  tabTextActive: { color: '#10b981', fontFamily: typography.bold },
  orderCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 28, 
    padding: 20, 
    borderWidth: 1.5, 
    borderColor: '#f8fafc', 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4
  },
  orderHeader: { marginBottom: 18 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontSize: 17, fontFamily: typography.bold, color: '#0f172a', letterSpacing: -0.5 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontFamily: typography.bold, letterSpacing: 0.5 },
  orderService: { fontSize: 15, fontFamily: typography.bold, color: '#475569' },
  orderDetails: { 
    gap: 12, 
    marginBottom: 24, 
    paddingVertical: 18, 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#f8fafc' 
  },
  orderDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderDetailText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 12 },
  trackBtn: { 
    flex: 1, 
    backgroundColor: '#10b981', 
    paddingVertical: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  trackBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#ffffff' },
  modifyBtn: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    paddingVertical: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modifyBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#475569' },
  cancelBtn: { 
    width: 60, 
    backgroundColor: '#fef2f2', 
    paddingVertical: 15, 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#fee2e2' 
  },
  cancelBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#dc2626' },
  reorderBtn: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    paddingVertical: 15, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  reorderBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 32, padding: 32, width: '100%', alignItems: 'center' },
  modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContentBottom: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: typography.bold, color: '#0f172a' },
  modalSubtitle: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  form: { gap: 12 },
  formLabel: { fontSize: 13, fontFamily: typography.bold, color: '#64748b' },
  formInput: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', minHeight: 80, textAlignVertical: 'top' },
  modalPrimaryBtn: { width: '100%', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalPrimaryBtnText: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
  cancelIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalDangerBtn: { width: '100%', backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
  modalDangerBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#fff' },
  modalSecondaryBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  modalSecondaryBtnText: { fontSize: 15, fontFamily: typography.semiBold, color: '#64748b' },
});

export default OrdersPage;
