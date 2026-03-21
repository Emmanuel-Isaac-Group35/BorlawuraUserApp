import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { RemixIcon } from '../../../utils/icons';

interface ServiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  scheduledTime: string;
  onTimeChange: (value: string) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ value, onChange, scheduledTime, onTimeChange }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate next 7 days
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    
    if (i === 0) return 'Today';
    if (i === 1) return 'Tomorrow';
    
    return d.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  });

  const services = [
    {
      id: 'instant',
      title: 'Instant Pickup',
      description: 'Get your waste collected within 30 minutes',
      icon: 'ri-flashlight-line',
      price: '₵15',
      badge: 'Fast'
    },
    {
      id: 'scheduled',
      title: 'Scheduled Pickup',
      description: 'Choose your preferred date and time',
      icon: 'ri-calendar-line',
      price: '₵12',
      badge: 'Save'
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
    if (serviceId === 'instant') {
      onTimeChange('');
    }
  };

  const handleDateTimeChange = (date = selectedDate, time = selectedTime) => {
    if (date && time) {
      onTimeChange(`${date} | ${time}`);
    }
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Service Type</Text>
      <Text style={styles.subtitle}>When do you need your waste collected?</Text>
      
      <View style={styles.content}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => handleServiceChange(service.id)}
            style={[
              styles.serviceCard,
              value === service.id && styles.serviceCardActive
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceLeft}>
                <View style={styles.iconWrapper}>
                  <RemixIcon name={service.icon} size={24} color="#10b981" />
                </View>
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{service.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
              </View>
              <Text style={styles.servicePrice}>{service.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {value === 'scheduled' && (
          <View style={styles.scheduleSection}>
            <Text style={styles.scheduleTitle}>Select Date & Time</Text>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dateInputText,
                    !selectedDate && { color: '#9ca3af' }
                  ]}>
                    {selectedDate || 'Select date'}
                  </Text>
                  <RemixIcon name="ri-calendar-line" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.inputLabel}>Time Slot</Text>
                <View style={styles.timeSlots}>
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => selectTime(slot)}
                      style={[
                        styles.timeSlot,
                        selectedTime === slot && styles.timeSlotActive
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === slot && styles.timeSlotTextActive
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Pickup Date</Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(false)}
                  style={styles.closeButton}
                >
                  <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateList}>
                {availableDates.map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateOption,
                      selectedDate === date && styles.dateOptionActive
                    ]}
                    onPress={() => selectDate(date)}
                  >
                    <View style={styles.dateOptionLeft}>
                      <View style={[
                        styles.radioCircle,
                        selectedDate === date && styles.radioCircleActive
                      ]}>
                        {selectedDate === date && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[
                        styles.dateOptionText,
                        selectedDate === date && styles.dateOptionTextActive
                      ]}>
                        {date}
                      </Text>
                    </View>
                    {date === 'Today' && <Text style={styles.todayBadge}>Limited slots</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
    gap: 16,
  },
  serviceCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  serviceCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  serviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065f46',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  scheduleSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  dateTimeContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  dateInputText: {
    fontSize: 14,
    color: '#1f2937',
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlots: {
    gap: 8,
  },
  timeSlot: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  timeSlotActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#374151',
  },
  timeSlotTextActive: {
    color: '#065f46',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  dateList: {
    gap: 12,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  dateOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  dateOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dateOptionTextActive: {
    color: '#065f46',
  },
  todayBadge: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
});
