import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

  const handleDateTimeChange = () => {
    if (selectedDate && selectedTime) {
      onTimeChange(`${selectedDate} ${selectedTime}`);
    }
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
                <TouchableOpacity style={styles.dateInput}>
                  <Text style={styles.dateInputText}>
                    {selectedDate || 'Select date'}
                  </Text>
                  <RemixIcon name="ri-calendar-line" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.inputLabel}>Time Slot</Text>
                <View style={styles.timeSlots}>
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => {
                        setSelectedTime(slot);
                        handleDateTimeChange();
                      }}
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
});
