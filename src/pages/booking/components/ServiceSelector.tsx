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
        {services.map((service) => {
          const isSelected = value === service.id;
          return (
            <TouchableOpacity
              key={service.id}
              onPress={() => handleServiceChange(service.id)}
              style={[styles.card, isSelected && styles.cardActive]}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: service.color + '15' }]}>
                 <RemixIcon name={service.icon} size={22} color={service.color} />
              </View>
              <View style={styles.info}>
                 <View style={styles.titleRow}>
                   <Text style={styles.cardTitle}>{service.title}</Text>
                   <View style={[styles.badge, { backgroundColor: service.id === 'instant' ? '#fee2e2' : '#dbeafe' }]}>
                      <Text style={[styles.badgeText, { color: service.id === 'instant' ? '#ef4444' : '#2563eb' }]}>{service.badge}</Text>
                   </View>
                 </View>
                 <Text style={styles.cardDesc}>{service.description}</Text>
              </View>
              <View style={[styles.check, isSelected && styles.checkActive]}>
                 {isSelected && <RemixIcon name="ri-check-line" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {value === 'scheduled' && (
        <View style={styles.scheduleBox}>
           <Text style={styles.scheduleTitle}>SELECT DATE & TIME</Text>
           
           <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerTrigger} activeOpacity={0.8}>
              <View style={styles.pickerLeft}>
                 <RemixIcon name="ri-calendar-line" size={18} color="#10b981" />
                 <Text style={[styles.pickerText, !selectedDate && styles.pickerPlaceholder]}>
                    {selectedDate || 'Choose Date'}
                 </Text>
              </View>
              <RemixIcon name="ri-arrow-down-s-line" size={20} color="#94a3b8" />
           </TouchableOpacity>

           <View style={styles.slotGrid}>
              {timeSlots.map(slot => {
                const isSlotSelected = selectedTime === slot;
                return (
                  <TouchableOpacity 
                     key={slot} 
                     onPress={() => selectTime(slot)}
                     style={[styles.slot, isSlotSelected && styles.slotActive]}
                     activeOpacity={0.8}
                  >
                     <Text style={[styles.slotText, isSlotSelected && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
           </View>
        </View>
      )}

      <Modal visible={showDatePicker} transparent animationType="slide" statusBarTranslucent>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalDragHandle} />
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeBtn} activeOpacity={0.7}>
                     <RemixIcon name="ri-close-line" size={20} color="#64748b" />
                  </TouchableOpacity>
               </View>
               <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
                  {availableDates.map(date => {
                    const isDateSelected = selectedDate === date;
                    return (
                      <TouchableOpacity 
                        key={date} 
                        onPress={() => selectDate(date)} 
                        style={[styles.dateItem, isDateSelected && styles.dateItemActive]}
                        activeOpacity={0.8}
                      >
                         <Text style={[styles.dateText, isDateSelected && styles.dateTextActive]}>{date}</Text>
                         {isDateSelected && <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />}
                      </TouchableOpacity>
                    );
                  })}
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
  title: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a' },
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
  cardTitle: { fontSize: 15, fontFamily: typography.bold, color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 9, fontFamily: typography.bold, letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, fontFamily: typography.medium, color: '#64748b' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  scheduleBox: { marginTop: 24, gap: 12 },
  scheduleTitle: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 1.5, marginBottom: 4 },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 14, fontFamily: typography.semiBold, color: '#1e293b' },
  pickerPlaceholder: { color: '#94a3b8' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 4 },
  slot: { width: '48%', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#f1f5f9', backgroundColor: '#ffffff', alignItems: 'center' },
  slotActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  slotText: { fontSize: 12, fontFamily: typography.semiBold, color: '#64748b', textAlign: 'center' },
  slotTextActive: { color: '#10b981', fontFamily: typography.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '60%', alignItems: 'center' },
  modalDragHandle: { width: 38, height: 5, borderRadius: 3, backgroundColor: '#e2e8f0', marginTop: 10, marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a' },
  closeBtn: { padding: 4, borderRadius: 10, backgroundColor: '#f1f5f9' },
  dateList: { width: '100%' },
  dateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateItemActive: { borderBottomColor: '#dcfce7' },
  dateText: { fontSize: 15, fontFamily: typography.medium, color: '#475569' },
  dateTextActive: { color: '#10b981', fontFamily: typography.bold },
});
