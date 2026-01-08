import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import { RemixIcon } from '../../../utils/icons';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange }) => {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(value);

  const handleCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address[0] 
        ? `${address[0].street || ''} ${address[0].district || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim()
        : 'Current Location - Accra, Ghana';

      setUseCurrentLocation(true);
      onChange(formattedAddress || 'Current Location - Accra, Ghana');
    } catch (error) {
      console.error('Error getting location:', error);
      onChange('Current Location - Accra, Ghana');
    }
  };

  const handleManualAddress = (address: string) => {
    setManualAddress(address);
    onChange(address);
    setUseCurrentLocation(false);
  };

  const savedAddresses = ['Home - East Legon, Accra', 'Office - Airport City, Accra'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Pickup Location</Text>
      <Text style={styles.subtitle}>Where should we collect your waste?</Text>
      
      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleCurrentLocation}
          style={[
            styles.optionCard,
            useCurrentLocation && styles.optionCardActive
          ]}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <View style={styles.iconWrapper}>
              <RemixIcon name="ri-map-pin-line" size={24} color="#10b981" />
            </View>
            <View style={styles.textWrapper}>
              <Text style={styles.optionTitle}>Use Current Location</Text>
              <Text style={styles.optionSubtitle}>We'll detect your location automatically</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Or enter address manually</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={manualAddress}
              onChangeText={handleManualAddress}
              placeholder="Enter your full address..."
              style={styles.input}
              placeholderTextColor="#9ca3af"
              multiline
            />
            <View style={styles.searchIcon}>
              <RemixIcon name="ri-search-line" size={20} color="#9ca3af" />
            </View>
          </View>
        </View>

        <View style={styles.savedSection}>
          <Text style={styles.label}>Saved Addresses</Text>
          <View style={styles.savedList}>
            {savedAddresses.map((address, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleManualAddress(address)}
                style={styles.savedItem}
                activeOpacity={0.8}
              >
                <RemixIcon name="ri-home-4-line" size={20} color="#9ca3af" />
                <Text style={styles.savedText}>{address}</Text>
              </TouchableOpacity>
            ))}
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
    gap: 16,
  },
  optionCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  optionCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#d1fae5',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputSection: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: 12,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  savedSection: {
    gap: 12,
  },
  savedList: {
    gap: 8,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  savedText: {
    fontSize: 14,
    color: '#374151',
  },
});
