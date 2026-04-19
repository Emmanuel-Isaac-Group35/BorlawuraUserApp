import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
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
      
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Highest 
      });
      const { latitude, longitude } = location.coords;
      
      setCoords({ latitude, longitude });
      
      // Try Google Maps first, then fallback to Expo
      let formatted = await reverseGeocode(latitude, longitude);
      
      if (formatted.startsWith('GPS:')) {
        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
        const addr = addresses[0];
        formatted = addr 
          ? `${addr.streetNumber || ''} ${addr.street || ''}, ${addr.district || addr.city || ''}`.trim() 
          : formatted;
      }
      
      selectAddress(formatted, latitude, longitude);
    } catch (e) {
      console.error(e);
      Alert.alert("GPS Error", "Unable to get high-accuracy location. Please check your GPS settings.");
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

  const getMapHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; background: #f8fafc; }
            .user-marker { width: 18px; height: 18px; background: #10b981; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(16,185,129,0.5); }
            .rider-marker { width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 2px solid #ffffff; opacity: 0.8; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${coords.latitude}, ${coords.longitude}], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
            L.marker([${coords.latitude}, ${coords.longitude}], { icon: L.divIcon({ className: 'user-marker', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
            const riders = ${JSON.stringify(onlineRiders)};
            riders.forEach(r => {
                if(r.latitude && r.longitude) {
                   L.marker([r.latitude, r.longitude], { icon: L.divIcon({ className: 'rider-marker', iconSize: [12, 12], iconAnchor: [6, 6] }) }).addTo(map);
                }
            });
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
         <WebView 
           key={`${coords.latitude}-${coords.longitude}-${onlineRiders.length}`}
           source={{ html: getMapHtml() }} 
           style={styles.map} 
           scrollEnabled={false} 
         />
         <TouchableOpacity onPress={handleDetectLocation} style={styles.gpsBtn}>
            {isDetecting ? <ActivityIndicator size="small" color="#10b981" /> : <RemixIcon name="ri-focus-3-fill" size={20} color="#10b981" />}
         </TouchableOpacity>
      </View>

      <View style={styles.selectionPanel}>
         <Text style={styles.panelTitle}>Select Pickup Address</Text>
         
         <ScrollView style={styles.addressList} showsVerticalScrollIndicator={false}>
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
  mapWrap: { height: 180, borderRadius: 20, overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative', marginBottom: 20 },
  map: { flex: 1 },
  gpsBtn: { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },
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

