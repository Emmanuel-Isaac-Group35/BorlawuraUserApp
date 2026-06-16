import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { supabase } from '../../../lib/supabase';
import { typography } from '../../../utils/typography';

interface PricingSummaryProps {
  bookingData: {
    serviceType: string;
    wasteTypes: string[];
    bagSize: string;
    location: string;
    scheduledTime: string;
    notes?: string;
    riderId: string | null;
  };
}

export const PricingSummary: React.FC<PricingSummaryProps> = ({ bookingData }) => {
  const [riderInfo, setRiderInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (bookingData.riderId) {
      const fetchRider = async () => {
        const { data } = await supabase.from('riders').select('*').eq('id', bookingData.riderId).single();
        if (data) {
          setRiderInfo({
            name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            avatar: data.avatar_url,
            phone: data.phone_number
          });
        }
      };
      fetchRider();
    }
  }, [bookingData.riderId]);

  // Price calculations matching the main page
  const basePrice = 30;
  
  let volumePrice = 0;
  if (bookingData.bagSize === 'small') volumePrice = 10;
  else if (bookingData.bagSize === 'medium') volumePrice = 25;
  else if (bookingData.bagSize === 'large') volumePrice = 45;
  else if (bookingData.bagSize === 'xl') volumePrice = 150;

  let priorityPrice = 0;
  if (bookingData.serviceType === 'instant') priorityPrice = 20;
  else if (bookingData.serviceType === 'bulk') priorityPrice = 50;

  const totalPrice = basePrice + volumePrice + priorityPrice;

  const details = [
    { label: 'Location', value: bookingData.location, icon: 'ri-map-pin-2-fill' },
    { label: 'Service Speed', value: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled Pickup', icon: 'ri-flashlight-fill' },
    { label: 'Schedule Date', value: bookingData.scheduledTime || 'ASAP (30-45 mins)', icon: 'ri-calendar-event-fill' },
    { label: 'Load Volume', value: (bookingData.bagSize || '').toUpperCase(), icon: 'ri-database-2-fill' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Booking</Text>
        <Text style={styles.subtitle}>Review your estimated receipt details</Text>
      </View>
      
      <View style={styles.receiptContainer}>
        {/* Receipt Header Top Card */}
        <View style={styles.receiptHeader}>
          <RemixIcon name="ri-bill-fill" size={24} color="#10b981" />
          <Text style={styles.receiptTitle}>Waste Collection Ticket</Text>
        </View>

        {/* Details section */}
        <View style={styles.detailsBlock}>
          {details.map((item, idx) => (
            <View key={idx} style={styles.detailRow}>
              <View style={styles.detailLabelRow}>
                <RemixIcon name={item.icon} size={14} color="#94a3b8" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>{item.label}</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Dotted Separator */}
        <View style={styles.dashedLineContainer}>
          <View style={styles.dashedLine} />
        </View>

        {/* Pricing breakdown section */}
        <View style={styles.breakdownBlock}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Pickup Fee</Text>
            <Text style={styles.breakdownValue}>GHS {basePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Volume Surcharge ({bookingData.bagSize})</Text>
            <Text style={styles.breakdownValue}>+ GHS {volumePrice.toFixed(2)}</Text>
          </View>
          {priorityPrice > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Service Speed Premium</Text>
              <Text style={styles.breakdownValue}>+ GHS {priorityPrice.toFixed(2)}</Text>
            </View>
          )}

          {/* Dotted Line */}
          <View style={[styles.dashedLineContainer, { marginVertical: 12 }]}>
            <View style={styles.dashedLine} />
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>GHS {totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes Instructions inside receipt */}
        {bookingData.notes ? (
           <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Special Instructions</Text>
              <Text style={styles.notesText}>{bookingData.notes}</Text>
           </View>
        ) : null}

        {/* Rider profile if assigned */}
        {riderInfo && (
           <View style={styles.riderSummary}>
              <View style={styles.divider} />
              <View style={styles.riderBox}>
                 <Image source={{ uri: riderInfo.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.riderImg} />
                 <View style={styles.riderMain}>
                    <Text style={styles.riderLabel}>Assigned Rider</Text>
                    <Text style={styles.riderName}>{riderInfo.name}</Text>
                 </View>
                 <View style={styles.statusBox}><View style={styles.dot} /><Text style={styles.statusText}>Selected</Text></View>
              </View>
           </View>
        )}
      </View>

      <View style={styles.disclaimer}>
         <RemixIcon name="ri-shield-check-fill" size={14} color="#10b981" />
         <Text style={styles.disclaimerText}>By booking, you agree to our service terms. Final fare is collected upon completion.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  receiptContainer: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: '#cbd5e1' },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  receiptTitle: { fontSize: 13, fontFamily: typography.bold, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 },
  detailsBlock: { marginTop: 14, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', width: '35%' },
  detailIcon: { marginRight: 6 },
  detailLabel: { fontSize: 12, fontFamily: typography.semiBold, color: '#64748b' },
  detailValue: { fontSize: 13, fontFamily: typography.bold, color: '#1e293b', flex: 1, textAlign: 'right' },
  dashedLineContainer: { height: 1, overflow: 'hidden', marginVertical: 14 },
  dashedLine: { height: 2, borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 1 },
  breakdownBlock: { gap: 8 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontSize: 12, fontFamily: typography.medium, color: '#64748b' },
  breakdownValue: { fontSize: 13, fontFamily: typography.semiBold, color: '#1e293b' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontFamily: typography.bold, color: '#0f172a' },
  totalValue: { fontSize: 18, fontFamily: typography.bold, color: '#10b981' },
  notesBox: { marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1' },
  notesTitle: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontSize: 13, fontFamily: typography.medium, color: '#475569', lineHeight: 18 },
  riderSummary: { marginTop: 8 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  riderBox: { flexDirection: 'row', alignItems: 'center' },
  riderImg: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f1f5f9' },
  riderMain: { flex: 1, marginLeft: 12 },
  riderLabel: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8' },
  riderName: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  statusText: { fontSize: 10, fontFamily: typography.bold, color: '#10b981' },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16, paddingHorizontal: 4 },
  disclaimerText: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8', flex: 1, lineHeight: 16 },
});
