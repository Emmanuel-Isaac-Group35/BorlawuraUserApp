import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';

interface ServiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  scheduledTime: string;
  onTimeChange: (time: string) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ value, onChange, scheduledTime, onTimeChange }) => {
  // ... (keep logic, but update styles and typography usage)
  const initialDate = scheduledTime ? scheduledTime.split('|')[0].trim() : '';
  const initialTime = scheduledTime ? scheduledTime.split('|')[1].trim() : '';

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [showDatePicker, setShowDatePicker] = useState(false);

  React.useEffect(() => {
    if (scheduledTime) {
      const parts = scheduledTime.split('|');
      if (parts.length === 2) {
        setSelectedDate(parts[0].trim());
        setSelectedTime(parts[1].trim());
      }
    }
  }, [scheduledTime]);

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (i === 0) return 'Today';
    if (i === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  });

  const services = [
    {
      id: 'instant',
      title: 'Instant Pickup',
      description: 'Collector arrives within 30-45 mins',
      icon: 'ri-flashlight-fill',
      badge: 'URGENT',
      color: '#10b981'
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      description: 'Book for a specific date and time',
      icon: 'ri-calendar-event-fill',
      badge: 'PLAN',
      color: '#3b82f6'
    }
  ];

  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM'
  ];

  const handleServiceChange = (serviceId: string) => {
    onChange(serviceId);
    if (serviceId === 'instant') onTimeChange('');
  };

  const handleDateTimeChange = (date = selectedDate, time = selectedTime) => {
    if (date && time) onTimeChange(`${date} | ${time}`);
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    handleDateTimeChange(date, selectedTime);
  };

  const selectTime = (time: string) => {
    setSelectedTime(time);
    handleDateTimeChange(selectedDate, time);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Type</Text>
        <Text style={styles.subtitle}>Choose your preferred pickup mode</Text>
      </View>
      
      <View style={styles.list}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => handleServiceChange(service.id)}
            style={[styles.card, value === service.id && styles.cardActive]}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: service.color + '15' }]}>
               <RemixIcon name={service.icon} size={24} color={service.color} />
            </View>
            <View style={styles.info}>
               <View style={styles.titleRow}>
                 <Text style={styles.cardTitle}>{service.title}</Text>
                 <View style={[styles.badge, { backgroundColor: service.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: service.color }]}>{service.badge}</Text>
                 </View>
               </View>
               <Text style={styles.cardDesc}>{service.description}</Text>
            </View>
            <View style={[styles.check, value === service.id && styles.checkActive]}>
               {value === service.id && <RemixIcon name="ri-check-line" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {value === 'scheduled' && (
        <View style={styles.scheduleBox}>
           <Text style={styles.scheduleTitle}>Details</Text>
           <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerTrigger}>
              <View style={styles.pickerLeft}>
                 <RemixIcon name="ri-calendar-line" size={18} color="#64748b" />
                 <Text style={[styles.pickerText, !selectedDate && styles.pickerPlaceholder]}>
                    {selectedDate || 'Select Date'}
                 </Text>
              </View>
              <RemixIcon name="ri-arrow-down-s-line" size={20} color="#94a3b8" />
           </TouchableOpacity>

           <View style={styles.slotGrid}>
              {timeSlots.map(slot => (
                <TouchableOpacity 
                   key={slot} 
                   onPress={() => selectTime(slot)}
                   style={[styles.slot, selectedTime === slot && styles.slotActive]}
                >
                   <Text style={[styles.slotText, selectedTime === slot && styles.slotTextActive]}>{slot}</Text>
                </TouchableOpacity>
              ))}
           </View>
        </View>
      )}

      <Modal visible={showDatePicker} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                     <RemixIcon name="ri-close-line" size={24} color="#64748b" />
                  </TouchableOpacity>
               </View>
               <ScrollView style={styles.dateList}>
                  {availableDates.map(date => (
                    <TouchableOpacity key={date} onPress={() => selectDate(date)} style={styles.dateItem}>
                       <Text style={[styles.dateText, selectedDate === date && styles.dateTextActive]}>{date}</Text>
                       {selectedDate === date && <RemixIcon name="ri-check-fill" size={20} color="#10b981" />}
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
         </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  cardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 16, fontFamily: typography.bold, color: '#1e293b' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontFamily: typography.bold },
  cardDesc: { fontSize: 13, fontFamily: typography.medium, color: '#64748b' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  scheduleBox: { marginTop: 24, gap: 12 },
  scheduleTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b' },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 14, fontFamily: typography.semiBold, color: '#1e293b' },
  pickerPlaceholder: { color: '#94a3b8' },
  slotGrid: { gap: 8 },
  slot: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#ffffff' },
  slotActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  slotText: { fontSize: 13, fontFamily: typography.medium, color: '#64748b', textAlign: 'center' },
  slotTextActive: { color: '#10b981', fontFamily: typography.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a' },
  dateList: { gap: 10 },
  dateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateText: { fontSize: 15, fontFamily: typography.medium, color: '#64748b' },
  dateTextActive: { color: '#10b981', fontFamily: typography.bold },
});
