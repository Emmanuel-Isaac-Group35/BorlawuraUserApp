import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { LocationSelector } from './components/LocationSelector';
import { ServiceSelector } from './components/ServiceSelector';
import { WasteTypeSelector } from './components/WasteTypeSelector';
import { PricingSummary } from './components/PricingSummary';
import { FindingRider } from './components/FindingRider';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';
import { resolveRealUserId } from '../../utils/user';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { PRICE_TABLE } from '../../utils/pricing';

const calculateEstimatedPrice = (serviceType: string, bagSize: string) => {
  return PRICE_TABLE[bagSize] ?? 0;
};


const BookingPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { width: screenWidth } = Dimensions.get('window');
  const params = (route.params as { editId?: string, type?: string | number }) || {};
  
  const isSmallScreen = screenWidth < 380;
  const paddingH = screenWidth * 0.05;

  const [step, setStep] = useState(1);
  const [showFindingRider, setShowFindingRider] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
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

  // Reset tab bar visibility on mount
  useEffect(() => {
    navigation.setParams({ hideTabBar: false });
  }, []);

  useEffect(() => {
    // Handle initial service type from params
    if (params.type && !bookingData.serviceType) {
        const typeStr = String(params.type);
        const initialServiceType = typeStr === '3' ? 'bulk' : 'instant';
        setBookingData(prev => ({ ...prev, serviceType: initialServiceType }));
    }

    // Handle edit mode
    if (params.editId) {
      const fetchEditData = async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', params.editId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setIsEditing(true);
            setBookingData({
              location: data.address || '',
              latitude: data.pickup_latitude || 5.6037,
              longitude: data.pickup_longitude || -0.1870,
              serviceType: data.service_type?.toLowerCase().includes('scheduled') ? 'scheduled' : (data.service_type?.toLowerCase().includes('bulk') ? 'bulk' : 'instant'),
              wasteTypes: data.waste_type?.split(', ').filter(Boolean) || [],
              bagSize: data.waste_size || '',
              scheduledTime: data.scheduled_at ? formatDateForSelector(data.scheduled_at) : '',
              notes: data.notes || '',
              riderId: data.rider_id
            });
          }
        } catch (e) {
          console.error("Edit load failed:", e);
        }
      };
      fetchEditData();
    }
  }, [params.editId, params.type]);

  useEffect(() => {
    const routeParams = (route.params as { prefillLocation?: string, prefillLat?: number, prefillLng?: number }) || {};
    if (
      routeParams.prefillLocation
      && Number.isFinite(Number(routeParams.prefillLat))
      && Number.isFinite(Number(routeParams.prefillLng))
    ) {
      setBookingData(prev => ({
        ...prev,
        location: routeParams.prefillLocation!,
        latitude: Number(routeParams.prefillLat),
        longitude: Number(routeParams.prefillLng)
      }));
      setStep(2);
    }
  }, [route.params]);

  const formatDateForSelector = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const options: any = { day: 'numeric', month: 'short' };
      const dateStr = d.toLocaleDateString('en-US', options);
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateStr} | ${timeStr}`;
    } catch (e) { return isoDate; }
  };

  const steps = [
    { id: 1, label: 'Location' },
    { id: 2, label: 'Service' },
    { id: 3, label: 'Waste' },
    { id: 4, label: 'Review' }
  ];

  const updateBookingData = (fieldOrData: string | object, value?: any) => {
    if (typeof fieldOrData === 'object') {
      setBookingData(prev => ({ ...prev, ...fieldOrData }));
    } else {
      setBookingData(prev => ({ ...prev, [fieldOrData]: value }));
    }
  };

  const nextStep = () => { 
    if (step < 4) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1); 
    }
  };
  const prevStep = () => { 
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1); 
    }
  };

  const handleBooking = async () => {
    if (isBooking) return;
    setIsBooking(true);
    try {
      const realUserId = await resolveRealUserId(user);
      if (!realUserId) { 
        Alert.alert("Auth Error", "Please re-login to proceed."); 
        setIsBooking(false); return; 
      }

      const orderPayload: any = {
        user_id: realUserId,
        customer_name: user?.full_name || 'Customer',
        service_type: bookingData.serviceType === 'instant' ? 'Instant Pickup' : (bookingData.serviceType === 'bulk' ? 'Bulk Collection' : 'Scheduled Pickup'),
        address: bookingData.location,
        pickup_latitude: bookingData.latitude,
        pickup_longitude: bookingData.longitude,
        waste_type: 'General',
        waste_size: bookingData.bagSize,
        notes: `${bookingData.notes || ''}`.trim(),
        status: 'pending',
        scheduled_at: new Date().toISOString() // Simpler for now
      };

      if (isEditing && params.editId) {
        const { error } = await supabase.from('orders').update(orderPayload).eq('id', params.editId);
        if (error) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Order updated.", [{ text: "OK", onPress: () => navigateTo('/track-order', { id: params.editId }) }]);
      } else {
        const { data, error } = await supabase.from('orders').insert([orderPayload]).select('id').single();
        if (error || !data) throw error;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCompletedOrder({ id: data.id });
        navigation.setParams({ hideTabBar: true });
        setShowFindingRider(true);
      }
    } catch (e: any) { 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", `Failed to place order: ${e.message || JSON.stringify(e)}`); 
    }
    finally { setIsBooking(false); }
  };

  if (showFindingRider) {
    return (
      <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <FindingRider 
          userLat={bookingData.latitude} userLng={bookingData.longitude}
          orderId={completedOrder?.id}
          onRiderFound={(r) => navigateTo('/track-order', { id: completedOrder?.id })} 
          onCancel={() => {
            navigation.setParams({ hideTabBar: false });
            setShowFindingRider(false);
          }}
        />
      </View>
    );
  }

  const currentStepData = steps[step - 1] || steps[0];

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100, paddingHorizontal: paddingH }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIndicatorPage}>
             <View style={styles.stepLineContainer}>
                {steps.map((s, idx) => (
                   <React.Fragment key={s.id}>
                      <View style={[styles.stepDot, step >= s.id && styles.stepDotActive]}>
                         {step > s.id ? (
                            <RemixIcon name="ri-check-line" size={14} color="#ffffff" />
                         ) : (
                            <Text style={[styles.stepNumText, step >= s.id && styles.stepNumTextActive]}>{s.id}</Text>
                         )}
                      </View>
                      {idx < steps.length - 1 && <View style={[styles.connector, step > s.id && styles.connectorActive]} />}
                   </React.Fragment>
                ))}
             </View>
             <Text style={styles.stepLabelMain}>{currentStepData.label}</Text>
          </View>

          <View style={styles.mainCard}>
            {step === 1 && (
              <LocationSelector
                value={bookingData.location}
                onChange={(v, c) => updateBookingData({
                  location: v,
                  ...(c ? { latitude: c.latitude, longitude: c.longitude } : {})
                })}
              />
            )}
            {step === 2 && <ServiceSelector value={bookingData.serviceType} onChange={(v) => updateBookingData('serviceType', v)} scheduledTime={bookingData.scheduledTime} onTimeChange={(v) => updateBookingData('scheduledTime', v)} />}
            {step === 3 && <WasteTypeSelector selectedSize={bookingData.bagSize} notes={bookingData.notes} onSizeChange={(v) => updateBookingData('bagSize', v)} onNotesChange={(v) => updateBookingData('notes', v)} />}
            {step === 4 && <PricingSummary bookingData={bookingData} />}
          </View>

          <View style={styles.footerNav}>
             {step > 1 && (
              <TouchableOpacity onPress={prevStep} style={styles.backBtn} activeOpacity={0.8}>
                <RemixIcon name="ri-arrow-left-s-line" size={20} color="#64748b" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
             )}
             
             <TouchableOpacity 
              onPress={step < 4 ? nextStep : handleBooking} 
              style={styles.nextBtnContainer}
              disabled={(step < 4 && !canGoNext(step, bookingData)) || isBooking}
              activeOpacity={0.9}
             >
                <LinearGradient
                   colors={((step < 4 && !canGoNext(step, bookingData)) || isBooking) ? ['#e2e8f0', '#cbd5e1'] : ['#10b981', '#059669']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={styles.nextBtnGradient}
                >
                  {isBooking ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>{step < 4 ? 'Continue' : 'Place Order'}</Text>
                      <RemixIcon name="ri-arrow-right-s-line" size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const canGoNext = (step: number, data: any) => {
  if (step === 1) {
    return !!data.location
      && Number.isFinite(data.latitude)
      && Number.isFinite(data.longitude);
  }
  if (step === 2) return !!data.serviceType;
  if (step === 3) return !!data.bagSize;
  return true;
};

export default BookingPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { },
  stepIndicatorPage: { marginBottom: 24, alignItems: 'center', paddingHorizontal: 10 },
  stepLineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 10 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#cbd5e1' },
  stepDotActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepNumText: { fontSize: 13, fontFamily: typography.bold, color: '#94a3b8' },
  stepNumTextActive: { color: '#ffffff' },
  connector: { flex: 1, height: 3, backgroundColor: '#f1f5f9', marginHorizontal: -4 },
  connectorActive: { backgroundColor: '#10b981' },
  stepLabelMain: { marginTop: 10, fontSize: 12, fontFamily: typography.bold, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1.5 },
  mainCard: { backgroundColor: '#ffffff', borderRadius: 24, marginBottom: 28 },
  footerNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 52, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  backBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#64748b', marginLeft: 4 },
  nextBtnContainer: { flex: 1, height: 52, borderRadius: 16, overflow: 'hidden' },
  nextBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  nextBtnText: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
});
