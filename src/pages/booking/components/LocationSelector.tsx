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
import { LinearGradient } from 'expo-linear-gradient';

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

  useEffect(() => {
    const ridersChannel = supabase
      .channel('location-selector-riders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, () => {
        fetchOnlineRiders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ridersChannel);
    };
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
    if (data) {
      setOnlineRiders(
        data.filter(r => {
          const lat = parseFloat(r.latitude);
          const lng = parseFloat(r.longitude);
          return Number.isFinite(lat) && Number.isFinite(lng);
        })
      );
    }
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please enable location to find riders near you.");
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Highest,
      });
      
      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });
      
      const formatted = await reverseGeocode(latitude, longitude);
      selectAddress(formatted, latitude, longitude);
      
    } catch (e) {
      console.error("GPS Detection Error:", e);
      try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const { latitude, longitude } = lastKnown.coords;
          setCoords({ latitude, longitude });
          const formatted = await reverseGeocode(latitude, longitude);
          selectAddress(formatted, latitude, longitude);
        } else {
           Alert.alert("GPS Error", "Unable to detect your location. Please try typing your address manually.");
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
    setMapCenter({ latitude: lat, longitude: lng });
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
           markers={onlineRiders.map((r) => ({
             id: `rider-${r.id}`,
             lat: parseFloat(r.latitude),
             lng: parseFloat(r.longitude),
             type: 'rider' as const,
           }))}
         />

         <TouchableOpacity onPress={handleDetectLocation} style={styles.recenterBtn} activeOpacity={0.85}>
            <RemixIcon name="ri-focus-3-fill" size={20} color="#0f172a" />
         </TouchableOpacity>

         <TouchableOpacity 
            onPress={confirmPinLocation} 
            style={styles.confirmPinContainer}
            disabled={isReverseGeocoding}
            activeOpacity={0.9}
         >
            <LinearGradient
               colors={['#1e293b', '#0f172a']}
               style={styles.confirmPinBtn}
            >
               {isReverseGeocoding ? (
                  <ActivityIndicator color="#fff" size="small" />
               ) : (
                  <>
                     <RemixIcon name="ri-map-pin-2-fill" size={18} color="#fff" />
                     <Text style={styles.confirmPinText}>Confirm Pin Location</Text>
                  </>
               )}
            </LinearGradient>
         </TouchableOpacity>
      </View>

      <View style={styles.selectionPanel}>
         <Text style={styles.panelTitle}>Select Pickup Address</Text>
         
         <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            <View style={styles.manualInput}>
               <View style={styles.inputWrapper}>
                  <RemixIcon name="ri-search-2-line" size={18} color="#94a3b8" style={styles.searchIcon} />
                  <TextInput 
                     value={value} 
                     onChangeText={handleSearch}
                     placeholder="Type address manually..."
                     placeholderTextColor="#94a3b8"
                     style={styles.input}
                  />
                  {isSearching ? (
                     <ActivityIndicator size="small" color="#10b981" style={styles.searchIndicator} />
                  ) : value ? (
                     <TouchableOpacity onPress={() => onChange('', null)} style={styles.clearSearchBtn} activeOpacity={0.7}>
                        <RemixIcon name="ri-close-circle-fill" size={18} color="#cbd5e1" />
                     </TouchableOpacity>
                  ) : null}
               </View>

               {searchResults.length > 0 ? (
                  <View style={styles.searchResults}>
                    {searchResults.map((item) => (
                      <TouchableOpacity 
                         key={item.place_id} 
                         style={styles.searchResultItem}
                         onPress={() => handleSelectPlace(item.place_id)}
                         activeOpacity={0.8}
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
            {value ? (
               <TouchableOpacity 
                  onPress={() => selectAddress(value, coords.latitude, coords.longitude)}
                  style={[styles.addressItem, styles.autoDetected]}
                  activeOpacity={0.8}
               >
                  <View style={styles.addrIconBox}><RemixIcon name="ri-gps-fill" size={18} color="#10b981" /></View>
                  <View style={styles.addrInfo}>
                     <Text style={styles.addrLabel}>Detected Location</Text>
                     <Text style={styles.addrText}>{value}</Text>
                  </View>
                  <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />
               </TouchableOpacity>
            ) : null}

            {/* Saved Addresses */}
            {savedAddresses.map((s, idx) => {
               const isSelected = value === s.address_text;
               return (
                  <TouchableOpacity 
                     key={`${s.id}-${idx}`} 
                     onPress={() => selectAddress(s.address_text, s.latitude, s.longitude)}
                     style={[styles.addressItem, isSelected && styles.addressItemActive]}
                     activeOpacity={0.8}
                  >
                     <View style={[styles.addrIconBox, isSelected ? styles.addrIconBoxActive : { backgroundColor: '#f1f5f9' }]}>
                        <RemixIcon 
                           name={s.label.toLowerCase().includes('home') ? "ri-home-6-fill" : "ri-briefcase-4-fill"} 
                           size={18} 
                           color={isSelected ? "#10b981" : "#64748b"} 
                        />
                     </View>
                     <View style={styles.addrInfo}>
                        <Text style={[styles.addrLabel, isSelected && styles.addrLabelActive]}>{s.label}</Text>
                        <Text style={styles.addrText}>{s.address_text}</Text>
                     </View>
                     {isSelected && <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />}
                  </TouchableOpacity>
               );
            })}
         </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative', marginBottom: 20, height: 280 },
  map: { flex: 1 },
  confirmPinContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 8,
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
  panelTitle: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  addressList: { maxHeight: 300 },
  addressItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1.5, borderColor: '#f1f5f9' },
  addressItemActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  autoDetected: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1.5 },
  addrIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addrIconBoxActive: { backgroundColor: '#e6fcf0' },
  addrInfo: { flex: 1 },
  addrLabel: { fontSize: 11, fontFamily: typography.bold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  addrLabelActive: { color: '#10b981' },
  addrText: { fontSize: 13, fontFamily: typography.medium, color: '#1e293b', marginTop: 1 },
  manualInput: { marginBottom: 12, position: 'relative' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', paddingHorizontal: 14 },
  searchIcon: { marginRight: 8 },
  clearSearchBtn: { padding: 4 },
  input: { flex: 1, height: '100%', fontSize: 14, fontFamily: typography.medium, color: '#0f172a' },
  searchIndicator: { paddingLeft: 8 },
  searchResults: { backgroundColor: '#ffffff', borderRadius: 16, marginTop: 8, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc', gap: 10 },
  searchResultInfo: { flex: 1 },
  searchResultText: { fontSize: 13, fontFamily: typography.medium, color: '#475569' },
  noResults: { padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, marginTop: 8, alignItems: 'center' },
  noResultsText: { fontSize: 13, fontFamily: typography.medium, color: '#64748b' },
});
