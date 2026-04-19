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
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';
import { resolveRealUserId } from '../../utils/user';

import { useRoute } from '@react-navigation/native';

const BookingPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { editId } = (route.params as { editId?: string }) || {};
  
  const [step, setStep] = useState(1);
  const [showFindingRider, setShowFindingRider] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
  const { user } = useAuth();

  React.useEffect(() => {
    if (editId) {
      const fetchEditData = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
              .eq('id', editId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setIsEditing(true);
            setBookingData({
              location: data.address || '',
              latitude: data.pickup_latitude,
              longitude: data.pickup_longitude,
              serviceType: data.service_type?.toLowerCase().includes('scheduled') ? 'scheduled' : 'instant',
              wasteTypes: data.waste_type?.split(', ').filter(Boolean) || [],
              bagSize: data.waste_size || '',
              scheduledTime: data.scheduled_at ? formatDateForSelector(data.scheduled_at) : '',
              notes: data.notes || '',
              riderId: data.rider_id
            });
          }
        } catch (e) {
          console.error("Failed to load order for editing:", e);
        }
      };
      fetchEditData();
    }
  }, [editId]);

  const formatDateForSelector = (isoDate: string) => {
    const d = new Date(isoDate);
    const options: any = { day: 'numeric', month: 'short' };
    const dateStr = d.toLocaleDateString('en-US', options);
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} | ${timeStr}`;
  };

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

  const nextStep = () => { if (step < 5) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const parseScheduledTime = (timeStr: string): string | null => {
    if (!timeStr || !timeStr.includes('|')) return null;
    try {
      const [datePart, timePart] = timeStr.split('|').map(s => s.trim());
      const now = new Date();
      let targetDate = new Date();
      if (datePart === 'Tomorrow') targetDate.setDate(now.getDate() + 1);
      else if (datePart === 'Today') targetDate = new Date();
      else {
          // Attempt to parse "15 Apr" or similar
          const parsed = Date.parse(`${datePart} ${now.getFullYear()}`);
          if (!isNaN(parsed)) targetDate = new Date(parsed);
      }
      
      const timeClean = timePart.split('-')[0].trim(); // Handle "08:00 AM - 10:00 AM" or just "08:00 AM"
      const [hourMin, ampm] = timeClean.split(' ');
      let [hours, minutes] = hourMin.split(':').map(Number);
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate.toISOString();
    } catch (e) { return new Date().toISOString(); }
  };

  const handleBooking = async () => {
    try {
      const realUserId = await resolveRealUserId(user);
      if (!realUserId) { Alert.alert("Error", "Logout and login again."); return; }

      const scheduled_at = bookingData.serviceType === 'instant' ? new Date().toISOString() : parseScheduledTime(bookingData.scheduledTime);

      const orderPayload: any = {
        user_id: realUserId,
        customer_name: user?.full_name || user?.name || 'Customer',
        service_type: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup',
        address: bookingData.location,
        pickup_latitude: bookingData.latitude,
        pickup_longitude: bookingData.longitude,
        waste_type: bookingData.wasteTypes.join(', '),
        waste_size: bookingData.bagSize,
        notes: `${bookingData.notes || ''} [Phone: ${user?.phone_number || ''}]`.trim(),
        status: isEditing ? 'pending' : 'pending', // Reset to pending if modified? Or keep status?
        scheduled_at: scheduled_at,
        rider_id: bookingData.riderId
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', editId);
        
        if (error) throw error;
        
        Alert.alert("Order Updated", "Your changes have been saved.", [
          { text: "OK", onPress: () => navigateTo('/track-order', { id: editId }) }
        ]);
      } else {
        const { data, error } = await supabase.from('orders').insert([orderPayload]).select('id').single();
        if (error || !data) throw error;
        setCompletedOrder({ id: data.id });
        setShowFindingRider(true);
      }
    } catch (e) { Alert.alert("Action Failed", "Check your connection and try again."); }
  };

  const handleRiderFound = (rider: any) => {
    setShowFindingRider(false);
    navigateTo('/track-order', { id: completedOrder?.id });
  };

  if (showFindingRider) {
    return (
      <SafeAreaView style={styles.container}>
        <Navigation />
        <FindingRider 
          userLat={bookingData.latitude} userLng={bookingData.longitude}
          orderId={completedOrder?.id} selectedRiderId={bookingData.riderId}
          onRiderFound={handleRiderFound} onCancel={() => setShowFindingRider(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.content, 
            { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }
          ]} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIndicatorPage}>
             <View style={styles.stepLineContainer}>
                {steps.map((s, idx) => (
                   <React.Fragment key={s.id}>
                      <View style={[styles.stepDot, step >= s.id && styles.stepDotActive]}>
                         {step > s.id ? <RemixIcon name="ri-check-line" size={12} color="#fff" /> : <Text style={[styles.stepNumText, step >= s.id && styles.stepNumTextActive]}>{s.id}</Text>}
                      </View>
                      {idx < steps.length - 1 && <View style={[styles.connector, step > s.id && styles.connectorActive]} />}
                   </React.Fragment>
                ))}
             </View>
             <Text style={styles.stepLabelMain}>{steps[step-1].label}</Text>
          </View>

          <View style={styles.mainCard}>
            {step === 1 && <LocationSelector value={bookingData.location} onChange={(v, c) => updateBookingData({ location: v, latitude: c?.latitude || null, longitude: c?.longitude || null })} />}
            {step === 2 && <ServiceSelector value={bookingData.serviceType} onChange={(v) => updateBookingData('serviceType', v)} scheduledTime={bookingData.scheduledTime} onTimeChange={(v) => updateBookingData('scheduledTime', v)} />}
            {step === 3 && <WasteTypeSelector selectedTypes={bookingData.wasteTypes} selectedSize={bookingData.bagSize} notes={bookingData.notes} onTypesChange={(v) => updateBookingData('wasteTypes', v)} onSizeChange={(v) => updateBookingData('bagSize', v)} onNotesChange={(v) => updateBookingData('notes', v)} />}
            {step === 4 && <RiderSelector selectedRiderId={bookingData.riderId} onSelect={(id) => updateBookingData('riderId', id)} />}
            {step === 5 && <PricingSummary bookingData={bookingData} />}
          </View>

          <View style={styles.footerNav}>
             {step > 1 && <TouchableOpacity onPress={prevStep} style={styles.backBtn}><RemixIcon name="ri-arrow-left-s-line" size={20} color="#64748b" /><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>}
             <TouchableOpacity onPress={step < 5 ? nextStep : handleBooking} style={[styles.nextBtn, (step < 5 && !canGoNext(step, bookingData)) && styles.nextBtnDisabled]} disabled={step < 5 && !canGoNext(step, bookingData)}>
                <Text style={styles.nextBtnText}>{step < 5 ? 'Continue' : (isEditing ? 'Save Changes' : 'Place Order')}</Text>
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
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  stepIndicatorPage: { marginBottom: 32, alignItems: 'center' },
  stepLineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 20 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  stepDotActive: { backgroundColor: '#10b981' },
  stepNumText: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8' },
  stepNumTextActive: { color: '#ffffff' },
  connector: { flex: 1, height: 2, backgroundColor: '#f1f5f9', marginHorizontal: -2, zIndex: 1 },
  connectorActive: { backgroundColor: '#10b981' },
  stepLabelMain: { marginTop: 12, fontSize: 14, fontFamily: typography.bold, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 },
  mainCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 2, marginBottom: 32 },
  footerNav: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16, backgroundColor: '#f8fafc', gap: 4 },
  backBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#64748b' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 16, backgroundColor: '#10b981', gap: 8, elevation: 4 },
  nextBtnDisabled: { backgroundColor: '#cbd5e1', elevation: 0 },
  nextBtnText: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
});
