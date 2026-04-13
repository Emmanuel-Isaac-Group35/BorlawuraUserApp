import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { supabase } from '../../../lib/supabase';

interface PricingSummaryProps {
  bookingData: {
    location: string;
    serviceType: string;
    wasteTypes: string[];
    bagSize: string;
    scheduledTime: string;
    notes: string;
    riderId: string | null;
  };
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({ bookingData }) => {
  const [riderInfo, setRiderInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (bookingData.riderId) {
      const fetchRider = async () => {
        const { data } = await supabase
          .from('riders')
          .select('*')
          .eq('id', bookingData.riderId)
          .single();
        if (data) {
          setRiderInfo({
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            avatar: data.avatar_url
          });
        }
      };
      fetchRider();
    }
  }, [bookingData.riderId]);

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

  return (
    <View style={styles.container}>
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

          {riderInfo && (
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <RemixIcon name="ri-user-follow-line" size={20} color="#10b981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Selected Rider</Text>
                <Text style={styles.detailValue}>{riderInfo.name}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
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
});

