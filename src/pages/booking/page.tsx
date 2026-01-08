import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Modal, TouchableOpacity, Alert } from 'react-native';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { LocationSelector } from './components/LocationSelector';
import { ServiceSelector } from './components/ServiceSelector';
import { WasteTypeSelector } from './components/WasteTypeSelector';
import { PricingSummary } from './components/PricingSummary';
import { Button } from '../../components/base/Button';
import { RemixIcon } from '../../utils/icons';
import { generateReceipt } from '../../utils/receiptGenerator';
import { navigateTo } from '../../utils/navigation';

const BookingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showReceipt, setShowReceipt] = useState(false);
  const [bookingData, setBookingData] = useState({
    location: '',
    serviceType: '',
    wasteTypes: [] as string[],
    bagSize: '',
    scheduledTime: '',
    notes: ''
  });

  const updateBookingData = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBooking = () => {
    // Simulate payment processing
    setTimeout(() => {
      setShowReceipt(true);
      generateReceipt({
        id: `BWS-${Date.now().toString().slice(-6)}`,
        service: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup',
        date: new Date().toLocaleDateString('en-GB'),
        time: bookingData.scheduledTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        address: bookingData.location,
        wasteType: bookingData.wasteTypes.join(', '),
        bagSize: bookingData.bagSize,
        amount: '₵25.00',
        rider: undefined,
        paymentMethod: 'Mobile Money'
      });
    }, 1500);
  };

  const resetBooking = () => {
    setStep(1);
    setShowReceipt(false);
    setBookingData({
      location: '',
      serviceType: '',
      wasteTypes: [],
      bagSize: '',
      scheduledTime: '',
      notes: ''
    });
  };

  if (showReceipt) {
    return (
      <SafeAreaView style={styles.container}>
        <Navigation />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.receiptContainer}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <RemixIcon name="ri-check-line" size={32} color="#10b981" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>Your waste collection has been scheduled</Text>
            </View>

            <View style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>Receipt</Text>
                <Text style={styles.receiptNumber}>Order #BWS-{Date.now().toString().slice(-6)}</Text>
              </View>

              <View style={styles.receiptDetails}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Service:</Text>
                  <Text style={styles.receiptValue}>{bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Location:</Text>
                  <Text style={styles.receiptValue}>{bookingData.location}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Scheduled:</Text>
                  <Text style={styles.receiptValue}>{bookingData.scheduledTime || 'Immediately'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Waste Types:</Text>
                  <Text style={styles.receiptValue}>{bookingData.wasteTypes.join(', ')}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Bag Size:</Text>
                  <Text style={styles.receiptValue}>{bookingData.bagSize}</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total Paid:</Text>
                  <Text style={styles.receiptTotalValue}>₵25.00</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <RemixIcon name="ri-information-line" size={20} color="#065f46" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>What's Next?</Text>
                  <Text style={styles.infoText}>
                    Our team will arrive at your location at the scheduled time. You'll receive SMS updates about your collection.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button 
                variant="primary" 
                onPress={() => Alert.alert('Print', 'Receipt printing functionality would be implemented here')}
                fullWidth
              >
                <View style={styles.buttonContent}>
                  <RemixIcon name="ri-printer-line" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Print Receipt</Text>
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Step {step} of 4</Text>
            <Text style={styles.progressPercent}>{Math.round((step / 4) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(step / 4) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.stepCard}>
          {step === 1 && (
            <LocationSelector 
              value={bookingData.location}
              onChange={(value) => updateBookingData('location', value)}
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
          
          {step < 4 ? (
            <Button 
              variant="primary" 
              onPress={nextStep}
              style={[styles.navButton, !(step > 1) && styles.navButtonFull]}
              disabled={
                (step === 1 && !bookingData.location) ||
                (step === 2 && !bookingData.serviceType) ||
                (step === 3 && bookingData.wasteTypes.length === 0)
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
              style={[styles.navButton, !(step > 1) && styles.navButtonFull]}
            >
              <View style={styles.buttonContent}>
                <RemixIcon name="ri-check-line" size={18} color="#fff" />
                <Text style={styles.buttonText}>Confirm & Pay</Text>
              </View>
            </Button>
          )}
        </View>
      </ScrollView>
      
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
    fontWeight: '500',
    color: '#4b5563',
  },
  progressPercent: {
    fontSize: 14,
    color: '#6b7280',
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
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  navButtonFull: {
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
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
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
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 14,
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
    color: '#4b5563',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: 'bold',
    color: '#1f2937',
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
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
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
});
