import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
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

  const details = [
    { label: 'Location', value: bookingData.location, icon: 'ri-map-pin-2-fill' },
    { label: 'Service', value: bookingData.serviceType === 'instant' ? 'Instant Pickup' : 'Scheduled', icon: 'ri-flashlight-fill' },
    { label: 'Schedule', value: bookingData.scheduledTime || 'ASAP (30-45 mins)', icon: 'ri-calendar-event-fill' },
    { label: 'Volume', value: (bookingData.bagSize || '').charAt(0).toUpperCase() + (bookingData.bagSize || '').slice(1), icon: 'ri-database-2-fill' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review & Confirm</Text>
        <Text style={styles.subtitle}>Please verify your pickup request details</Text>
      </View>
      
      <View style={styles.summaryCard}>
        {details.map((item, idx) => (
          <View key={idx} style={[styles.row, idx === details.length - 1 && styles.rowLast]}>
            <View style={styles.rowLead}>
              <View style={styles.iconBox}><RemixIcon name={item.icon} size={16} color="#10b981" /></View>
              <Text style={styles.rowLabel}>{item.label}</Text>
            </View>
            <Text style={styles.rowValue} numberOfLines={2}>{item.value}</Text>
          </View>
        ))}

        {bookingData.notes ? (
           <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Instructions</Text>
              <Text style={styles.notesText}>{bookingData.notes}</Text>
           </View>
        ) : null}

        {riderInfo && (
           <View style={styles.riderSummary}>
              <View style={styles.divider} />
              <View style={styles.riderBox}>
                 <Image source={{ uri: riderInfo.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} style={styles.riderImg} />
                 <View style={styles.riderMain}>
                    <Text style={styles.riderLabel}>Your Preferred Rider</Text>
                    <Text style={styles.riderName}>{riderInfo.name}</Text>
                 </View>
                 <View style={styles.statusBox}><View style={styles.dot} /><Text style={styles.statusText}>Selected</Text></View>
              </View>
           </View>
        )}
      </View>

      <View style={styles.disclaimer}>
         <RemixIcon name="ri-information-fill" size={14} color="#94a3b8" />
         <Text style={styles.disclaimerText}>By confirming, you agree to our service terms and pickup guidelines.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowLast: { borderBottomWidth: 0 },
  rowLead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13, fontFamily: typography.semiBold, color: '#64748b' },
  rowValue: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a', flex: 1, textAlign: 'right', marginLeft: 16 },
  notesBox: { marginTop: 16, padding: 14, backgroundColor: '#f8fafc', borderRadius: 16 },
  notesTitle: { fontSize: 12, fontFamily: typography.bold, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' },
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
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 20, paddingHorizontal: 4 },
  disclaimerText: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8', flex: 1, lineHeight: 16 },
});
