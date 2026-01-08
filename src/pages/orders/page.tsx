import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Modal, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { generateReceipt } from '../../utils/receiptGenerator';
import { navigateTo } from '../../utils/navigation';

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [orders, setOrders] = useState([
    {
      id: 'BW001',
      status: 'in_progress',
      service: 'Instant Pickup',
      date: '2024-01-15',
      time: '14:30',
      address: '123 Osu Street, Accra',
      rider: 'Kwame Asante',
      riderPhone: '+233 24 123 4567',
      amount: '₵15.00',
      wasteType: 'General Household',
      bagSize: 'Medium',
      estimatedArrival: '15 mins',
      paymentMethod: 'MTN Mobile Money'
    },
    {
      id: 'BW002',
      status: 'scheduled',
      service: 'Scheduled Pickup',
      date: '2024-01-16',
      time: '09:00',
      address: '456 East Legon, Accra',
      amount: '₵12.00',
      wasteType: 'Recyclables',
      bagSize: 'Large',
      paymentMethod: 'Vodafone Cash'
    },
    {
      id: 'BW003',
      status: 'completed',
      service: 'Organic Waste',
      date: '2024-01-14',
      time: '16:45',
      address: '789 Tema Community 1',
      rider: 'Ama Serwaa',
      amount: '₵8.00',
      wasteType: 'Organic',
      bagSize: 'Small',
      rating: 5,
      paymentMethod: 'MTN Mobile Money'
    },
    {
      id: 'BW004',
      status: 'completed',
      service: 'Bulk Collection',
      date: '2024-01-12',
      time: '11:20',
      address: '321 Kumasi Central',
      rider: 'Kofi Mensah',
      amount: '₵25.00',
      wasteType: 'Mixed',
      bagSize: 'Extra Large',
      rating: 4,
      paymentMethod: 'Visa Card'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' };
      case 'scheduled': return { bg: '#fed7aa', text: '#9a3412' };
      case 'completed': return { bg: '#d1fae5', text: '#065f46' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
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

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? { ...order, rating } : order
    ));
    setShowRatingModal(false);
    setRating(0);
    setSelectedOrder(null);
  };

  const handleModifyOrder = (order: any) => {
    setSelectedOrder(order);
    setShowModifyModal(true);
  };

  const handleCancelOrder = (order: any) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = () => {
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? { ...order, status: 'cancelled' } : order
    ));
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  const handleSaveModification = () => {
    if (!selectedOrder) return;
    // Modification logic would go here
    setShowModifyModal(false);
    setSelectedOrder(null);
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
        amount: order.amount,
        rider: order.rider,
        paymentMethod: order.paymentMethod
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  const displayOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <BottomNavigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>Track and manage your waste collection orders</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('active')}
            style={[
              styles.tab,
              activeTab === 'active' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive
            ]}>
              Active ({activeOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            style={[
              styles.tab,
              activeTab === 'completed' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'completed' && styles.tabTextActive
            ]}>
              Completed ({completedOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <RemixIcon name="ri-file-list-3-line" size={32} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active' 
                ? 'You don\'t have any active orders at the moment'
                : 'You haven\'t completed any orders yet'
              }
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
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <View style={styles.orderIdRow}>
                        <Text style={styles.orderId}>#{order.id}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {getStatusText(order.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.orderService}>{order.service}</Text>
                    </View>
                    <Text style={styles.orderAmount}>{order.amount}</Text>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <RemixIcon name="ri-calendar-line" size={16} color="#6b7280" />
                      <Text style={styles.orderDetailText}>{order.date} at {order.time}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <RemixIcon name="ri-map-pin-line" size={16} color="#6b7280" />
                      <Text style={styles.orderDetailText}>{order.address}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <RemixIcon name="ri-delete-bin-line" size={16} color="#6b7280" />
                      <Text style={styles.orderDetailText}>{order.wasteType} • {order.bagSize} bag</Text>
                    </View>
                  </View>

                  {order.status === 'in_progress' && order.rider && (
                    <View style={styles.riderCard}>
                      <View style={styles.riderHeader}>
                        <Text style={styles.riderTitle}>Rider Assigned</Text>
                        <Text style={styles.riderETA}>ETA: {order.estimatedArrival}</Text>
                      </View>
                      <View style={styles.riderInfo}>
                        <Text style={styles.riderName}>{order.rider}</Text>
                        <TouchableOpacity
                          onPress={() => handleCallRider(order.riderPhone!)}
                          style={styles.callButton}
                        >
                          <RemixIcon name="ri-phone-line" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {order.status === 'completed' && (
                    <>
                      <View style={styles.ratingContainer}>
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <RemixIcon
                              key={star}
                              name={star <= (order.rating || 0) ? 'ri-star-fill' : 'ri-star-line'}
                              size={16}
                              color="#fbbf24"
                            />
                          ))}
                        </View>
                        {!order.rating && (
                          <TouchableOpacity
                            onPress={() => handleRateOrder(order)}
                            style={styles.rateButton}
                          >
                            <Text style={styles.rateButtonText}>Rate Order</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => handleDownloadReceipt(order)}
                        style={styles.downloadButton}
                      >
                        <RemixIcon name="ri-file-download-line" size={16} color="#10b981" />
                        <Text style={styles.downloadButtonText}>Download Receipt</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <View style={styles.actionButtons}>
                    {order.status === 'in_progress' && (
                      <TouchableOpacity
                        onPress={() => handleTrackOrder(order.id)}
                        style={styles.trackButton}
                      >
                        <Text style={styles.trackButtonText}>Track Order</Text>
                      </TouchableOpacity>
                    )}
                    {order.status === 'scheduled' && (
                      <>
                        <TouchableOpacity 
                          onPress={() => handleModifyOrder(order)}
                          style={styles.modifyButton}
                        >
                          <Text style={styles.modifyButtonText}>Modify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => handleCancelOrder(order)}
                          style={styles.cancelButton}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {order.status === 'completed' && (
                      <TouchableOpacity
                        onPress={() => handleReorder(order.id)}
                        style={styles.reorderButton}
                      >
                        <Text style={styles.reorderButtonText}>Reorder</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <Text style={styles.modalSubtitle}>How was your pickup service?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <RemixIcon
                    name={rating >= star ? 'ri-star-fill' : 'ri-star-line'}
                    size={36}
                    color="#fbbf24"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setSelectedOrder(null);
                }}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitRating}
                style={styles.modalSubmitButton}
              >
                <Text style={styles.modalSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modify Order Modal */}
      <Modal
        visible={showModifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modify Order</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModifyModal(false);
                  setSelectedOrder(null);
                }}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  defaultValue={selectedOrder?.date}
                  placeholder="Select date"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  defaultValue={selectedOrder?.time}
                  placeholder="Select time"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  defaultValue={selectedOrder?.address}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveModification}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIcon}>
              <RemixIcon name="ri-error-warning-line" size={32} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel order #{selectedOrder?.id}? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setSelectedOrder(null);
                }}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Keep Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancelOrder}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default OrdersPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  tabTextActive: {
    color: '#10b981',
  },
  ordersList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderService: {
    fontSize: 14,
    color: '#4b5563',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  riderCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  riderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  riderETA: {
    fontSize: 12,
    color: '#1e40af',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riderName: {
    fontSize: 14,
    color: '#1e40af',
  },
  callButton: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  rateButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  trackButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modifyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
  reorderButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalBottomContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  starButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  warningIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fee2e2',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formInput: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
