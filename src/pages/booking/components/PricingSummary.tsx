import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RemixIcon } from '../../../utils/icons';

interface PricingSummaryProps {
  bookingData: {
    location: string;
    serviceType: string;
    wasteTypes: string[];
    bagSize: string;
    scheduledTime: string;
    notes: string;
  };
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({ bookingData }) => {
  const getServicePrice = () => {
    return bookingData.serviceType === 'instant' ? 15 : 12;
  };

  const getSizePrice = () => {
    switch (bookingData.bagSize) {
      case 'medium': return 5;
      case 'large': return 10;
      default: return 0;
    }
  };

  const getWasteTypeNames = () => {
    const typeMap: { [key: string]: string } = {
      'general': 'General Household Waste'
    };
    return bookingData.wasteTypes.map(type => typeMap[type]).join(', ');
  };

  const getSizeLabel = () => {
    const sizeMap: { [key: string]: string } = {
      'small': 'Small Bag (1-2 bags)',
      'medium': 'Medium Bin (3-5 bags)',
      'large': 'Large Sack (6+ bags)'
    };
    return sizeMap[bookingData.bagSize] || '';
  };

  const basePrice = getServicePrice();
  const sizePrice = getSizePrice();
  const serviceFee = 2;
  const totalPrice = basePrice + sizePrice + serviceFee;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Booking Summary</Text>
      <Text style={styles.subtitle}>Review your pickup details</Text>
      
      <View style={styles.content}>
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <View style={styles.detailIcon}>
              <RemixIcon name="ri-map-pin-line" size={20} color="#10b981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{bookingData.location}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailIcon}>
              <RemixIcon name="ri-time-line" size={20} color="#10b981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Service Type</Text>
              <Text style={styles.detailValue}>
                {bookingData.serviceType === 'instant' ? 'Instant Pickup (30 mins)' : 'Scheduled Pickup'}
                {bookingData.scheduledTime && (
                  <Text>{'\n'}{bookingData.scheduledTime}</Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <View style={styles.detailIcon}>
              <RemixIcon name="ri-delete-bin-line" size={20} color="#10b981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Waste Details</Text>
              <Text style={styles.detailValue}>
                {getWasteTypeNames()}
                {'\n'}{getSizeLabel()}
                {bookingData.notes && (
                  <Text>
                    {'\n\n'}
                    <Text style={styles.notesLabel}>Notes:</Text> {bookingData.notes}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceSectionTitle}>Price Breakdown</Text>
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup'}
              </Text>
              <Text style={styles.priceValue}>₵{basePrice}</Text>
            </View>
            
            {sizePrice > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Size Upgrade</Text>
                <Text style={styles.priceValue}>₵{sizePrice}</Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>₵{serviceFee}</Text>
            </View>
            
            <View style={styles.priceDivider} />
            
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₵{totalPrice}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentIcon}>
              <RemixIcon name="ri-smartphone-line" size={20} color="#10b981" />
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentMethodTitle}>Mobile Money</Text>
              <Text style={styles.paymentMethodSubtitle}>Pay with MTN/Vodafone/AirtelTigo</Text>
            </View>
            <RemixIcon name="ri-check-line" size={24} color="#10b981" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 24,
  },
  content: {
    gap: 24,
  },
  detailsSection: {
    gap: 16,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  notesLabel: {
    fontWeight: '600',
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  priceSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  priceDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  paymentSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentContent: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
