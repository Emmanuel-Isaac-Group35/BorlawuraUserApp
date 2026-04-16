import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
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
  const insets = useSafeAreaInsets();
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

  const steps = [
    { id: 1, label: 'Location' },
    { id: 2, label: 'Service' },
    { id: 3, label: 'Waste' },
    { id: 4, label: 'Rider' },
    { id: 5, label: 'Review' }
  ];

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
             Alert.alert("Account Not Synced", "Please sign out and sign in again.");
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
          Alert.alert("Booking Error", "Unable to save booking. Please try again.");
          return;
        }

        newOrder.id = insertedOrderData.id;
        setCompletedOrder(newOrder);
        setShowFindingRider(true);
      } else {
        Alert.alert("Error", "You must be logged in to book.");
      }
    } catch (e) {
      Alert.alert("Error", "Critical booking failure.");
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
          onCancel={() => setShowFindingRider(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={false}
        >
          
          <View style={styles.stepIndicatorPage}>
             <View style={styles.stepLineContainer}>
                {steps.map((s, idx) => (
                   <React.Fragment key={s.id}>
                      <View style={[styles.stepDot, step >= s.id && styles.stepDotActive]}>
                         {step > s.id ? (
                            <RemixIcon name="ri-check-line" size={12} color="#fff" />
                         ) : (
                            <Text style={[styles.stepNumText, step >= s.id && styles.stepNumTextActive]}>{s.id}</Text>
                         )}
                      </View>
                      {idx < steps.length - 1 && (
                         <View style={[styles.connector, step > s.id && styles.connectorActive]} />
                      )}
                   </React.Fragment>
                ))}
             </View>
             <Text style={styles.stepLabelMain}>{steps[step-1].label}</Text>
          </View>

          <View style={styles.mainCard}>
            {step === 1 && (
              <LocationSelector
                value={bookingData.location}
                onChange={(value, coords) => updateBookingData({
                    location: value,
                    latitude: coords?.latitude || null,
                    longitude: coords?.longitude || null
                })}
              />
            )}

            {step === 2 && (
              <ServiceSelector
                value={bookingData.serviceType}
                onChange={(v) => updateBookingData('serviceType', v)}
                scheduledTime={bookingData.scheduledTime}
                onTimeChange={(v) => updateBookingData('scheduledTime', v)}
              />
            )}

            {step === 3 && (
              <WasteTypeSelector
                selectedTypes={bookingData.wasteTypes}
                selectedSize={bookingData.bagSize}
                notes={bookingData.notes}
                onTypesChange={(v) => updateBookingData('wasteTypes', v)}
                onSizeChange={(v) => updateBookingData('bagSize', v)}
                onNotesChange={(v) => updateBookingData('notes', v)}
              />
            )}

            {step === 4 && (
              <RiderSelector
                selectedRiderId={bookingData.riderId}
                onSelect={(id) => updateBookingData('riderId', id)}
              />
            )}

            {step === 5 && <PricingSummary bookingData={bookingData} />}
          </View>

          <View style={styles.footerNav}>
             {step > 1 && (
                <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
                   <RemixIcon name="ri-arrow-left-s-line" size={20} color="#64748b" />
                   <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
             )}
             
             <TouchableOpacity 
                onPress={step < 5 ? nextStep : handleBooking}
                style={[styles.nextBtn, (step < 5 && !canGoNext(step, bookingData)) && styles.nextBtnDisabled]}
                disabled={step < 5 && !canGoNext(step, bookingData)}
             >
                <Text style={styles.nextBtnText}>{step < 5 ? 'Continue' : 'Place Order'}</Text>
                <RemixIcon name={step < 5 ? "ri-arrow-right-s-line" : "ri-check-line"} size={20} color="#fff" />
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const canGoNext = (step: number, data: any) => {
  if (step === 1) return !!data.location;
  if (step === 2) return !!data.serviceType;
  if (step === 3) return data.wasteTypes.length > 0 && !!data.bagSize;
  if (step === 4) return !!data.riderId;
  return true;
};

export default BookingPage;

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
  stepIndicatorPage: {
    marginBottom: 32,
    alignItems: 'center',
  },
  stepLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotActive: {
    backgroundColor: '#10b981',
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: '#94a3b8',
  },
  stepNumTextActive: {
    color: '#ffffff',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#f1f5f9',
    marginHorizontal: -2,
    zIndex: 1,
  },
  connectorActive: {
    backgroundColor: '#10b981',
  },
  stepLabelMain: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 2,
    marginBottom: 32,
  },
  footerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#64748b',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 18,
    backgroundColor: '#10b981',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
});
