import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { RemixIcon } from '../../../utils/icons';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { typography } from '../../../utils/typography';

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

  useEffect(() => {
    fetchCloudAddresses();
    fetchOnlineRiders();
    handleDetectLocation();
  }, []);

  const fetchCloudAddresses = async () => {
    if (!user) return;
    try {
      let searchId = user.supabase_id || user.id;
      
      // Handle mobile 'user_' prefix if present
      if (searchId && String(searchId).startsWith('user_')) {
        let searchPhone = (user.phone_number || user.phoneNumber || '').replace(/\s+/g, '');
        if (searchPhone.startsWith('0')) searchPhone = '+233' + searchPhone.substring(1);
        else if (searchPhone && !searchPhone.startsWith('+')) searchPhone = '+233' + searchPhone;
        
        const searchEmail = user.email && user.email.includes('@') ? user.email : null;
        let query = supabase.from('users').select('id');
        if (searchPhone && searchEmail) query = query.or(`phone_number.eq.${searchPhone},email.eq.${searchEmail}`);
        else if (searchPhone) query = query.eq('phone_number', searchPhone);
        else if (searchEmail) query = query.eq('email', searchEmail);
        
        const { data: dbUser } = await query.single();
        if (dbUser) searchId = dbUser.id;
      }

      if (!searchId || String(searchId).startsWith('user_')) return;

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
      
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const addr = addresses[0];
      const formatted = addr 
        ? `${addr.streetNumber || ''} ${addr.street || ''}, ${addr.district || addr.city || ''}`.trim() 
        : `GPS Pin: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      
      selectAddress(formatted, latitude, longitude);
    } catch (e) {
      console.error(e);
      Alert.alert("GPS Error", "Unable to get high-accuracy location. Please check your GPS settings.");
    } finally {
      setIsDetecting(false);
    }
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
            {savedAddresses.map((s) => (
               <TouchableOpacity 
                  key={s.id} 
                  onPress={() => selectAddress(s.address_text, s.latitude, s.longitude)}
                  style={styles.addressItem}
               >
                  <View style={[styles.addrIconBox, { backgroundColor: '#f1f5f9' }]}><RemixIcon name={s.label.toLowerCase().includes('home') ? "ri-home-fill" : "ri-briefcase-fill"} size={18} color="#64748b" /></View>
                  <View style={styles.addrInfo}>
                     <Text style={styles.addrLabel}>{s.label}</Text>
                     <Text style={styles.addrText}>{s.address_text}</Text>
                  </View>
                  {value === s.address_text && <RemixIcon name="ri-checkbox-circle-fill" size={20} color="#10b981" />}
               </TouchableOpacity>
            ))}

            <View style={styles.manualInput}>
               <TextInput 
                  value={value} 
                  onChangeText={(t) => onChange(t, null)}
                  placeholder="Or type address manually..."
                  style={styles.input}
               />
            </View>
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
  manualInput: { marginTop: 4 },
  input: { borderBottomWidth: 1.5, borderBottomColor: '#f1f5f9', paddingVertical: 10, fontSize: 14, fontFamily: typography.medium, color: '#1e293b' },
});

