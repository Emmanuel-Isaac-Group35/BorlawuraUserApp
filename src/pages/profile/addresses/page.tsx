import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, ActivityIndicator, TextInput, Modal 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Navigation } from '../../../components/feature/Navigation';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';
import * as Location from 'expo-location';

const SavedAddressesPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAddresses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow location access to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
      
      // Reverse geocode to get address text
      const reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (reverse[0]) {
        const addr = `${reverse[0].streetNumber || ''} ${reverse[0].street || ''}, ${reverse[0].city || ''}`.trim();
        setAddressText(addr);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not detect your location');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!label || !addressText) {
      Alert.alert('Incomplete', 'Please provide a label and an address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_addresses')
        .insert([{
          user_id: user.id,
          label,
          address_text: addressText,
          latitude: coords?.lat,
          longitude: coords?.lng
        }]);

      if (error) throw error;
      
      setShowAddModal(false);
      setLabel('');
      setAddressText('');
      setCoords(null);
      fetchAddresses();
      Alert.alert('Success', 'Address saved successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert('Delete', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('user_addresses').delete().eq('id', id);
          fetchAddresses();
        } catch (e) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Saved Addresses</Text>
          <Text style={styles.subtitle}>Manage your frequent pickup locations</Text>
        </View>

        {loading && !showAddModal ? (
          <ActivityIndicator color="#10b981" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.addressList}>
            {addresses.map((item) => (
              <View key={item.id} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.labelRow}>
                    <RemixIcon 
                      name={item.label.toLowerCase().includes('home') ? "ri-home-line" : "ri-briefcase-line"} 
                      size={20} color="#10b981" 
                    />
                    <Text style={styles.label}>{item.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteAddress(item.id)}>
                    <RemixIcon name="ri-delete-bin-line" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.addressText}>{item.address_text}</Text>
                {item.latitude && (
                  <View style={styles.gpsBadge}>
                    <RemixIcon name="ri-map-pin-fill" size={10} color="#3b82f6" />
                    <Text style={styles.gpsText}>GPS Pin Active</Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowAddModal(true)}
            >
              <RemixIcon name="ri-add-line" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <RemixIcon name="ri-close-line" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Label (e.g. Home, Office)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Home" 
                  value={label}
                  onChangeText={setLabel}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput 
                  style={[styles.input, { height: 80 }]} 
                  placeholder="Street name, Area" 
                  multiline
                  value={addressText}
                  onChangeText={setAddressText}
                />
              </View>

              <TouchableOpacity 
                style={styles.locateButton} 
                onPress={handleGetCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator color="#3b82f6" />
                ) : (
                  <>
                    <RemixIcon name="ri-focus-3-line" size={18} color="#3b82f6" />
                    <Text style={styles.locateText}>Use Current Location</Text>
                    {coords && <RemixIcon name="ri-check-line" size={18} color="#10b981" />}
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveAddress}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', marginTop: 4 },
  addressList: { gap: 16 },
  addressCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontFamily: typography.bold, color: '#1e293b' },
  addressText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', lineHeight: 20 },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  gpsText: { fontSize: 10, fontFamily: typography.bold, color: '#3b82f6', textTransform: 'uppercase' },
  addButton: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, gap: 10, marginTop: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  addButtonText: { fontSize: 16, fontFamily: typography.bold, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: typography.bold, color: '#0f172a' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: typography.medium, color: '#64748b' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 16, padding: 16, fontSize: 14, fontFamily: typography.medium, color: '#1e293b' },
  locateButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#dbeafe' },
  locateText: { flex: 1, fontSize: 14, fontFamily: typography.bold, color: '#3b82f6' },
  saveBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#fff' }
});

export default SavedAddressesPage;
