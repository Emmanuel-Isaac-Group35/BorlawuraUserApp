import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NavigatrMap } from '../../../components/feature/NavigatrMap';
import * as Location from 'expo-location';
import { RemixIcon } from '../../../utils/icons';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { typography } from '../../../utils/typography';
import { resolveRealUserId } from '../../../utils/user';
import { reverseGeocode, fetchPlacesAutocomplete, fetchPlaceDetails } from '../../../utils/maps';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string, coords?: { latitude: number; longitude: number } | null) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange }) => {
  const { user } = useAuth();
  const [coords, setCoords] = useState({ latitude: 5.6037, longitude: -0.1870 });
  const [isDetecting, setIsDetecting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [onlineRiders, setOnlineRiders] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCloudAddresses();
    fetchOnlineRiders();
    handleDetectLocation();
  }, []);

  const fetchCloudAddresses = async () => {
    const searchId = await resolveRealUserId(user);
    if (!searchId) return;

    try {
      const { data } = await supabase.from('user_addresses').select('*').eq('user_id', searchId);
      if (data) setSavedAddresses(data);
    } catch (e) {
      console.error("Failed to fetch address sync:", e);
    }
  };

  const fetchOnlineRiders = async () => {
    const { data } = await supabase.from('riders').select('id, latitude, longitude').eq('is_online', true).limit(10);
    if (data) setOnlineRiders(data);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please enable location to find riders near you.");
        return;
      }
      
      // Try to get current position with high accuracy
      // If it takes too long or fails, we'll catch it
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Highest, // Use highest accuracy for precise map centering
      });
      
      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });
      
      // Get human-readable address
      const formatted = await reverseGeocode(latitude, longitude);
      selectAddress(formatted, latitude, longitude);
      
    } catch (e) {
      console.error("GPS Detection Error:", e);
      // Fallback to last known position if current fails
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const { latitude, longitude } = lastKnown.coords;
          setCoords({ latitude, longitude });
          const formatted = await reverseGeocode(latitude, longitude);
          selectAddress(formatted, latitude, longitude);
        } else {
           Alert.alert("GPS Error", "Unable to detect your location. Please try typing your address or check your GPS settings.");
        }
      } catch (fallbackError) {
        Alert.alert("GPS Error", "Unable to detect your location. Please check your device settings.");
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSearch = async (text: string) => {
    onChange(text, null);
    if (text.length > 2) {
      setIsSearching(true);
      const results = await fetchPlacesAutocomplete(text);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPlace = async (placeId: string) => {
    setIsSearching(true);
    const details = await fetchPlaceDetails(placeId);
    if (details) {
      selectAddress(details.address, details.latitude, details.longitude);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const selectAddress = (addrText: string, lat: number, lng: number) => {
    setCoords({ latitude: lat, longitude: lng });
    onChange(addrText, { latitude: lat, longitude: lng });
  };

  const [mapCenter, setMapCenter] = useState({ latitude: coords.latitude, longitude: coords.longitude });
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const handleRegionChange = (region: any) => {
    setMapCenter({ latitude: region.latitude, longitude: region.longitude });
  };

  const confirmPinLocation = async () => {
    setIsReverseGeocoding(true);
    try {
      const address = await reverseGeocode(mapCenter.latitude, mapCenter.longitude);
      selectAddress(address, mapCenter.latitude, mapCenter.longitude);
    } catch (e) {
      Alert.alert("Error", "Could not determine address for this location.");
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
         <NavigatrMap 
           height={280}
           centerLat={coords.latitude} 
           centerLng={coords.longitude}
           zoom={16}
           interactive={true}
           fitToMarkers={false}
           showCenterPin={true}
           showRadar={false}
           onRegionChangeComplete={handleRegionChange}
           style={styles.map}
           markers={[
             ...onlineRiders.map((r, i) => ({ 
               id: `rider-${r.id}`,
               lat: r.latitude ? parseFloat(r.latitude) : coords.latitude + (Math.random() - 0.5) * 0.05, 
               lng: r.longitude ? parseFloat(r.longitude) : coords.longitude + (Math.random() - 0.5) * 0.05, 
               type: 'rider' as const 
             }))
           ]}
         />



         <TouchableOpacity onPress={handleDetectLocation} style={styles.recenterBtn}>
            <RemixIcon name="ri-focus-3-fill" size={20} color="#0f172a" />
         </TouchableOpacity>

         <TouchableOpacity 
            onPress={confirmPinLocation} 
            style={styles.confirmPinBtn}
            disabled={isReverseGeocoding}
         >
            {isReverseGeocoding ? (
               <ActivityIndicator color="#fff" size="small" />
            ) : (
               <>
                  <RemixIcon name="ri-map-pin-2-fill" size={18} color="#fff" />
                  <Text style={styles.confirmPinText}>Confirm Pin Location</Text>
               </>
            )}
         </TouchableOpacity>
      </View>

      <View style={styles.selectionPanel}>
         <Text style={styles.panelTitle}>Select Pickup Address</Text>
         
         <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            <View style={styles.manualInput}>
               <View style={styles.inputWrapper}>
                  <TextInput 
                     value={value} 
                     onChangeText={handleSearch}
                     placeholder="Or type address manually..."
                     style={styles.input}
                  />
                  {isSearching && <ActivityIndicator size="small" color="#10b981" style={styles.searchIndicator} />}
               </View>

               {searchResults.length > 0 ? (
                 <View style={styles.searchResults}>
                   {searchResults.map((item, idx) => (
                     <TouchableOpacity 
                        key={item.place_id} 
                        style={styles.searchResultItem}
                        onPress={() => handleSelectPlace(item.place_id)}
                     >
                       <RemixIcon name="ri-map-pin-2-line" size={16} color="#64748b" />
                       <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultText} numberOfLines={1}>{item.description}</Text>
                       </View>
                     </TouchableOpacity>
                   ))}
                 </View>
               ) : (
                 value.length > 2 && !isSearching && (
                   <View style={styles.noResults}>
                      <Text style={styles.noResultsText}>No addresses found in Ghana</Text>
                   </View>
                 )
               )}
            </View>

            {/* Automatic Detection Result */}
            <TouchableOpacity 
               onPress={() => selectAddress(value, coords.latitude, coords.longitude)}
               style={[styles.addressItem, styles.autoDetected]}
            >
               <View style={styles.addrIconBox}><RemixIcon name="ri-gps-fill" size={18} color="#10b981" /></View>
               <View style={styles.addrInfo}>
                  <Text style={styles.addrLabel}>Detected Location</Text>
                  <Text style={styles.addrText}>{value}</Text>
               </View>
               {value && <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />}
            </TouchableOpacity>

            {/* Saved Addresses */}
            {savedAddresses.map((s, idx) => (
               <TouchableOpacity 
                  key={`${s.id}-${idx}`} 
                  onPress={() => selectAddress(s.address_text, s.latitude, s.longitude)}
                  style={styles.addressItem}
               >
                  <View style={[styles.addrIconBox, { backgroundColor: '#f1f5f9' }]}><RemixIcon name={s.label.toLowerCase().includes('home') ? "ri-home-6-fill" : "ri-briefcase-4-fill"} size={18} color="#64748b" /></View>
                  <View style={styles.addrInfo}>
                     <Text style={styles.addrLabel}>{s.label}</Text>
                     <Text style={styles.addrText}>{s.address_text}</Text>
                  </View>
                  {value === s.address_text && <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />}
               </TouchableOpacity>
            ))}
         </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative', marginBottom: 20, height: 280 },
  map: { flex: 1 },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinIconWrapper: {
    transform: [{ translateY: -4 }],
  },
  pinShadow: {
    width: 6,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    position: 'absolute',
    bottom: -2,
  },
  confirmPinBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmPinText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#fff',
  },
  recenterBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionPanel: { gap: 12 },
  panelTitle: { fontSize: 14, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  addressList: { maxHeight: 300 },
  addressItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  autoDetected: { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' },
  addrIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addrInfo: { flex: 1 },
  addrLabel: { fontSize: 12, fontFamily: typography.bold, color: '#64748b' },
  addrText: { fontSize: 13, fontFamily: typography.medium, color: '#1e293b', marginTop: 1 },
  manualInput: { marginTop: 4, position: 'relative' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#f1f5f9' },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: typography.medium, color: '#1e293b' },
  searchIndicator: { paddingLeft: 8 },
  searchResults: { backgroundColor: '#ffffff', borderRadius: 16, marginTop: 8, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc', gap: 10 },
  searchResultInfo: { flex: 1 },
  searchResultText: { fontSize: 13, fontFamily: typography.medium, color: '#475569' },
  searchResultSubtext: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8', marginTop: 1 },
  noResults: { padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, marginTop: 8, alignItems: 'center' },
  noResultsText: { fontSize: 13, fontFamily: typography.medium, color: '#64748b' },
});

