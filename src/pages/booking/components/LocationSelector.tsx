import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { RemixIcon } from '../../../utils/icons';
import { useAuth } from '../../../context/AuthContext';
import { typography } from '../../../utils/typography';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string, lat?: number | null, lng?: number | null) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange }) => {
  const { user } = useAuth();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(value);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  React.useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const stored = await RNAsyncStorage.getItem('user_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSavedAddresses(parsed.map((a: any) => a.address));
        } else if (user?.location) {
          setSavedAddresses([user.location]);
        }
      } catch (e) {
        console.error("Error loading saved addresses", e);
      }
    };
    loadSavedAddresses();
  }, [user]);

  const handleCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setUseCurrentLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsDetectingLocation(false);
        setUseCurrentLocation(false);
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = null;
      try {
        location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]) as Location.LocationObject;
        }
      } catch (innerError) {
        try {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        } catch (finalError) {
          if (__DEV__) {
            location = { coords: { latitude: 5.6037, longitude: -0.1870, altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0 }, timestamp: Date.now() };
          } else {
            throw finalError;
          }
        }
      }

      if (!location) throw new Error('All location detection methods failed');

      const { latitude, longitude } = location.coords;
      let formattedAddress = '';
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        const addr = addresses[0];
        formattedAddress = addr 
          ? `${addr.streetNumber ? addr.streetNumber + ' ' : ''}${addr.street || ''}, ${addr.district || addr.city || ''}`.trim().replace(/^,\s*/, '')
          : (latitude === 5.6037 ? 'Accra Central, Ghana (Default)' : `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } catch (geoError) {
        formattedAddress = latitude === 5.6037 ? 'Accra Central, Ghana (Default)' : `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      setManualAddress(formattedAddress);
      onChange(formattedAddress, { latitude, longitude });
    } catch (error) {
      setUseCurrentLocation(false);
      Alert.alert('Location Error', 'Unable to detect your current location.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleManualAddress = (address: string) => {
    setManualAddress(address);
    onChange(address);
    setUseCurrentLocation(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pickup Location</Text>
        <Text style={styles.subtitle}>Where should we collect your waste?</Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleCurrentLocation}
          style={[styles.gpsCard, useCurrentLocation && styles.gpsCardActive]}
          activeOpacity={0.8}
          disabled={isDetectingLocation}
        >
          <View style={[styles.gpsIconBox, useCurrentLocation && styles.gpsIconBoxActive]}>
             {isDetectingLocation ? (
               <ActivityIndicator size="small" color="#10b981" />
             ) : (
               <RemixIcon name="ri-gps-fill" size={24} color={useCurrentLocation ? "#fff" : "#10b981"} />
             )}
          </View>
          <View style={styles.gpsText}>
             <Text style={[styles.gpsTitle, useCurrentLocation && styles.gpsTitleActive]}>
                {isDetectingLocation ? 'Pinpointing...' : 'Current Location'}
             </Text>
             <Text style={[styles.gpsDesc, useCurrentLocation && styles.gpsDescActive]}>
                {isDetectingLocation ? 'Checking satellites' : 'Smart auto-detection'}
             </Text>
          </View>
          {useCurrentLocation && !isDetectingLocation && (
             <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />
          )}
        </TouchableOpacity>

        <View style={styles.dividerBox}>
           <View style={styles.line} />
           <Text style={styles.dividerText}>OR MANUAL ENTRY</Text>
           <View style={styles.line} />
        </View>

        <View style={styles.inputCard}>
           <View style={styles.inputLead}>
              <RemixIcon name="ri-map-pin-2-fill" size={18} color="#94a3b8" />
              <Text style={styles.inputLabel}>Collection Address</Text>
           </View>
           <TextInput
             value={manualAddress}
             onChangeText={handleManualAddress}
             placeholder="Enter your street name, house number, etc."
             style={styles.input}
             placeholderTextColor="#cbd5e1"
             multiline
           />
        </View>

        {savedAddresses.length > 0 && (
           <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>SAVED LOCATIONS</Text>
              <View style={styles.savedList}>
                {savedAddresses.map((address, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleManualAddress(address)}
                    style={styles.savedItem}
                  >
                    <View style={styles.savedIconBox}>
                       <RemixIcon name="ri-home-fill" size={16} color="#64748b" />
                    </View>
                    <Text style={styles.savedText} numberOfLines={1}>{address}</Text>
                    <Text style={styles.useLabel}>USE</Text>
                  </TouchableOpacity>
                ))}
              </View>
           </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  content: { gap: 20 },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  gpsCardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  gpsIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  gpsIconBoxActive: { backgroundColor: '#10b981' },
  gpsText: { flex: 1, marginLeft: 14 },
  gpsTitle: { fontSize: 15, fontFamily: typography.bold, color: '#0f172a' },
  gpsTitleActive: { color: '#065f46' },
  gpsDesc: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8' },
  gpsDescActive: { color: '#10b981' },
  dividerBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  line: { flex: 1, height: 1.5, backgroundColor: '#f1f5f9' },
  dividerText: { fontSize: 10, fontFamily: typography.bold, color: '#cbd5e1', letterSpacing: 1 },
  inputCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  inputLead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputLabel: { fontSize: 13, fontFamily: typography.bold, color: '#64748b' },
  input: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#0f172a',
    padding: 0,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  savedSection: { marginTop: 8 },
  savedTitle: { fontSize: 11, fontFamily: typography.bold, color: '#cbd5e1', marginBottom: 12, letterSpacing: 1 },
  savedList: { gap: 10 },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  savedIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  savedText: { flex: 1, marginLeft: 12, fontSize: 14, fontFamily: typography.medium, color: '#475569' },
  useLabel: { fontSize: 11, fontFamily: typography.bold, color: '#10b981', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f0fdf4', borderRadius: 6 },
});
