import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { LocationSelector } from './components/LocationSelector';
import { ServiceSelector } from './components/ServiceSelector';
import { WasteTypeSelector } from './components/WasteTypeSelector';
import { RiderSelector } from './components/RiderSelector';
import { PricingSummary } from './components/PricingSummary';
import { FindingRider } from './components/FindingRider';
import { Button } from '../../components/base/Button';
import { RemixIcon } from '../../utils/icons';
import { generateReceipt } from '../../utils/receiptGenerator';
import { navigateTo } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';

const BookingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showFindingRider, setShowFindingRider] = useState(false);
  const [bookingData, setBookingData] = useState({
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    serviceType: '',
    wasteTypes: [] as string[],
    bagSize: '',
    scheduledTime: '',
    notes: '',
    riderId: null as string | null
  });

  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [assignedRider, setAssignedRider] = useState<any>(null);

  const updateBookingData = (fieldOrData: string | object, value?: any) => {
    if (typeof fieldOrData === 'object') {
      setBookingData(prev => ({ ...prev, ...fieldOrData }));
    } else {
      setBookingData(prev => ({ ...prev, [fieldOrData]: value }));
    }
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const { user } = useAuth();
  
  const handleBooking = async () => {
    const newOrder = {
      id: `BWS-${Date.now().toString().slice(-6)}`,
      service: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup',
      date: new Date().toLocaleDateString('en-GB'),
      time: bookingData.scheduledTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      address: bookingData.location,
      wasteType: bookingData.wasteTypes.join(', '),
      bagSize: bookingData.bagSize
    };

    try {
      if (user && (user.id || user.supabase_id)) {
        let realUserId = user.supabase_id || user.id;
        
        // Special recovery: If the ID is a placeholder from a manual session
        if (realUserId && realUserId.toString().startsWith('user_')) {
          let searchPhone = (user.phoneNumber || user.phone_number || '').replace(/\s+/g, '');
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
          if (dbUser) {
            realUserId = dbUser.id;
          } else {
             Alert.alert("Account Not Synced", "We couldn't find your account in our database. Please try signing out and signing in again.");
             return;
          }
        }

        const { data: insertedOrderData, error } = await supabase.from('orders').insert([{
          user_id: realUserId,
          customer_name: user?.full_name || user?.name || 'Customer',
          service_type: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup',
          address: bookingData.location,
          pickup_latitude: bookingData.latitude,
          pickup_longitude: bookingData.longitude,
          waste_type: bookingData.wasteTypes.join(', '),
          waste_size: bookingData.bagSize,
          notes: `${bookingData.notes || ''} [Phone: ${user?.phone_number || user?.phoneNumber || ''}]`.trim(),
          status: 'pending',
          scheduled_at: bookingData.scheduledTime ? new Date().toISOString() : null,
          rider_id: bookingData.riderId
        }]).select('id').single();
        
        if (error || !insertedOrderData) {
          console.error("Supabase order insert error:", JSON.stringify(error, null, 2));
          Alert.alert("Booking Error", "We couldn't save your booking to the server. Please check your connection.");
          return;
        }

        newOrder.id = insertedOrderData.id;

        setCompletedOrder(newOrder);
        setShowFindingRider(true);
      } else {
        Alert.alert("Error", "You must be logged in to book a service.");
      }
    } catch (e) {
      console.error("Critical booking failure:", e);
      Alert.alert("System Error", "Something went wrong during the booking process.");
    }
  };

  const resetBooking = () => {
    setStep(1);
    setShowReceipt(false);
    setShowFindingRider(false);
    setCompletedOrder(null);
    setAssignedRider(null);
    setBookingData({
      location: '',
      latitude: null,
      longitude: null,
      serviceType: '',
      wasteTypes: [],
      bagSize: '',
      scheduledTime: '',
      notes: '',
      riderId: null
    });
  };

  const handleRiderFound = (rider: any) => {
    setAssignedRider(rider);
    setShowFindingRider(false);
    navigateTo('/track-order', { id: completedOrder?.id });
  };

  const handleCancelSearching = () => {
    setShowFindingRider(false);
    Alert.alert("Search Cancelled", "Rider search has been stopped.");
  };

  if (showFindingRider) {
    return (
      <SafeAreaView style={styles.container}>
        <Navigation />
        <FindingRider 
          userLat={bookingData.latitude}
          userLng={bookingData.longitude}
          orderId={completedOrder?.id}
          selectedRiderId={bookingData.riderId}
          onRiderFound={handleRiderFound}
          onCancel={handleCancelSearching}
        />
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  if (showReceipt) {
    return (
      <SafeAreaView style={styles.container}>
        <Navigation />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.receiptContainer}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <RemixIcon name="ri-calendar-check-line" size={32} color="#10b981" />
              </View>
              <Text style={styles.successTitle}>Booking Confirmed!</Text>
              <Text style={styles.successSubtitle}>Your waste collection has been successfully scheduled</Text>
            </View>

            <View style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>Receipt</Text>
                <Text style={styles.receiptNumber}>Order #{completedOrder?.id}</Text>
              </View>

              <View style={styles.receiptDetails}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Service:</Text>
                  <Text style={styles.receiptValue}>{completedOrder?.service}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Location:</Text>
                  <Text style={styles.receiptValue}>{completedOrder?.address}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Scheduled:</Text>
                  <Text style={styles.receiptValue}>{completedOrder?.time || 'Immediately'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Waste Type:</Text>
                  <Text style={styles.receiptValue}>{completedOrder?.wasteType}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Bag Size:</Text>
                  <Text style={styles.receiptValue}>{completedOrder?.bagSize}</Text>
                </View>
                {assignedRider && (
                  <View style={styles.riderSummary}>
                    <View style={styles.receiptDivider} />
                    <Text style={styles.riderSummaryTitle}>Assigned Rider</Text>
                    <View style={styles.riderSummaryContent}>
                      <Image source={{ uri: assignedRider.photo }} style={styles.riderSummaryPhoto} />
                      <View style={styles.riderSummaryInfo}>
                        <Text style={styles.riderSummaryName}>{assignedRider.name}</Text>
                        <Text style={styles.riderSummaryStatus}>Arriving in a tricycle</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.trackBtn}
                        onPress={() => navigateTo('/track-order', { id: completedOrder?.id })}
                      >
                        <Text style={styles.trackBtnText}>Track</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View style={[styles.receiptRow, { justifyContent: 'center' }]}>
                  <Text style={styles.receiptLabel}>Status: </Text>
                  <Text style={[styles.receiptValue, { color: '#10b981', textAlign: 'left', flex: 0 }]}>Confirmed</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <RemixIcon name="ri-information-line" size={20} color="#065f46" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>What's Next?</Text>
                  <Text style={styles.infoText}>
                    {assignedRider 
                      ? `${assignedRider.name} is on the way to your location. You can track their real-time location using the "Track" button above.`
                      : "Our team will arrive at your location at the scheduled time. You'll receive SMS updates about your collection."}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                onPress={() => completedOrder && generateReceipt(completedOrder)}
                fullWidth
              >
                <View style={styles.buttonContent}>
                  <RemixIcon name="ri-printer-line" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Download Receipt PDF</Text>
                </View>
              </Button>

              <Button
                variant="outline"
                onPress={resetBooking}
                fullWidth
              >
                <View style={styles.buttonContent}>
                  <RemixIcon name="ri-add-line" size={18} color="#10b981" />
                  <Text style={[styles.buttonText, styles.buttonTextOutline]}>Book Another Service</Text>
                </View>
              </Button>
            </View>
          </View>
        </ScrollView>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Step {step} of 5</Text>
            <Text style={styles.progressPercent}>{Math.round((step / 5) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / 5) * 100}%` }
              ]}
            />
          </View>
        </View>

        <View style={styles.stepCard}>
          {step === 1 && (
            <LocationSelector
              value={bookingData.location}
              onChange={(value, coords) => {
                if (coords) {
                  updateBookingData({
                    location: value,
                    latitude: coords.latitude,
                    longitude: coords.longitude
                  });
                } else {
                  updateBookingData({
                    location: value,
                    latitude: null,
                    longitude: null
                  });
                }
              }}
            />
          )}

          {step === 2 && (
            <ServiceSelector
              value={bookingData.serviceType}
              onChange={(value) => updateBookingData('serviceType', value)}
              scheduledTime={bookingData.scheduledTime}
              onTimeChange={(value) => updateBookingData('scheduledTime', value)}
            />
          )}

          {step === 3 && (
            <WasteTypeSelector
              selectedTypes={bookingData.wasteTypes}
              selectedSize={bookingData.bagSize}
              notes={bookingData.notes}
              onTypesChange={(value) => updateBookingData('wasteTypes', value)}
              onSizeChange={(value) => updateBookingData('bagSize', value)}
              onNotesChange={(value) => updateBookingData('notes', value)}
            />
          )}

          {step === 4 && (
            <RiderSelector
              selectedRiderId={bookingData.riderId}
              onSelect={(id) => updateBookingData('riderId', id)}
            />
          )}

          {step === 5 && (
            <PricingSummary
              bookingData={bookingData}
            />
          )}
        </View>

        <View style={styles.navigationButtons}>
          {step > 1 && (
            <Button
              variant="outline"
              onPress={prevStep}
              style={styles.navButton}
            >
              <View style={styles.buttonContent}>
                <RemixIcon name="ri-arrow-left-line" size={18} color="#10b981" />
                <Text style={[styles.buttonText, styles.buttonTextOutline]}>Back</Text>
              </View>
            </Button>
          )}

          {step < 5 ? (
            <Button
              variant="primary"
              onPress={nextStep}
              style={styles.navButton}
              disabled={
                (step === 1 && !bookingData.location) ||
                (step === 2 && !bookingData.serviceType) ||
                (step === 3 && bookingData.wasteTypes.length === 0) ||
                (step === 4 && !bookingData.riderId)
              }
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue</Text>
                <RemixIcon name="ri-arrow-right-line" size={18} color="#fff" />
              </View>
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={handleBooking}
              style={styles.navButton}
            >
              <View style={styles.buttonContent}>
                <RemixIcon name="ri-check-line" size={18} color="#fff" />
                <Text style={styles.buttonText}>Confirm Booking</Text>
              </View>
            </Button>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

export default BookingPage;

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
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#4b5563',
  },
  progressPercent: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: typography.regular,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: typography.semiBold,
  },
  buttonTextOutline: {
    color: '#10b981',
  },
  receiptContainer: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#d1fae5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: typography.semiBold,
    color: '#1f2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#4b5563',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  receiptTitle: {
    fontSize: 18,
    fontFamily: typography.semiBold,
    color: '#1f2937',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#6b7280',
  },
  receiptDetails: {
    gap: 12,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#4b5563',
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginVertical: 12,
  },
  receiptTotalLabel: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#1f2937',
  },
  receiptTotalValue: {
    display: 'none',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#047857',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  riderSummary: {
    marginTop: 8,
  },
  riderSummaryTitle: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#1f2937',
    marginBottom: 12,
  },
  riderSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riderSummaryPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  riderSummaryInfo: {
    flex: 1,
  },
  riderSummaryName: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#1f2937',
  },
  riderSummaryStatus: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#10b981',
  },
  trackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    color: '#10b981',
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontFamily: typography.regular,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
