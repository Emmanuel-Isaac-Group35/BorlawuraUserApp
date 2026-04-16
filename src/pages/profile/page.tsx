import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';

const ProfilePage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { logout, refreshUser, user: authUser } = useAuth();
  const [user, setUser] = useState({
    name: authUser?.full_name || authUser?.name || 'Valued User',
    email: authUser?.email || 'No email provided',
    phone: authUser?.phone_number || authUser?.phoneNumber || 'No phone number',
    avatar: authUser?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalOrders: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async () => {
    if (authUser?.supabase_id || authUser?.id) {
      const searchId = authUser.supabase_id || authUser.id;
      if (!searchId || String(searchId).startsWith('user_')) return;
      
      setIsLoading(true);
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', searchId)
          .single();

        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', searchId)
          .eq('status', 'completed');

        if (dbUser) {
          const avatarUrl = dbUser.avatar_url 
            ? `${dbUser.avatar_url.split('?')[0]}?t=${new Date().getTime()}`
            : user.avatar;

          setUser(prev => ({
            ...prev,
            name: dbUser.full_name || prev.name,
            email: dbUser.email || prev.email,
            phone: dbUser.phone_number || prev.phone,
            avatar: avatarUrl,
            totalOrders: count || 0
          }));
        }
      } catch (e) {
        console.error("Failed to fetch fresh user data:", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authUser) {
      setUser(prev => ({
        ...prev,
        name: authUser.full_name || authUser.name || 'Valued User',
        email: authUser.email || 'No email provided',
        phone: authUser.phone_number || authUser.phoneNumber || 'No phone number'
      }));
      fetchUserData();

      const searchId = authUser.supabase_id || authUser.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const channel = supabase
          .channel('profile-stats-updates')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${searchId}` },
            () => fetchUserData()
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    }
  }, [authUser]);

  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    const loadStoredAddresses = async () => {
      try {
        const stored = await RNAsyncStorage.getItem('user_addresses');
        if (stored) {
          setAddresses(JSON.parse(stored));
        } else {
          setAddresses([{
            id: 1,
            label: 'Register Location',
            address: authUser?.location || 'No location set',
            isDefault: true
          }]);
        }
      } catch (e) {
        console.error("Failed to load addresses", e);
      }
    };
    loadStoredAddresses();
  }, [authUser?.location]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setEditAvatar(result.assets[0].uri);
  };

  const menuItems = [
    { icon: 'ri-map-pin-2-fill', title: 'Saved Addresses', subtitle: `${addresses.length} locations`, action: () => setShowAddAddress(true), color: '#10b981' },
    { icon: 'ri-bank-card-fill', title: 'Payment Methods', subtitle: 'Manage your cards', action: () => navigateTo('/payment-methods'), color: '#3b82f6' },
    { icon: 'ri-history-fill', title: 'Pickup History', subtitle: 'View past orders', action: () => navigateTo('/orders'), color: '#8b5cf6' },
    { icon: 'ri-customer-service-2-fill', title: 'Help Center', subtitle: 'FAQs & Support', action: () => navigateTo('/support'), color: '#f59e0b' },
    { icon: 'ri-settings-4-fill', title: 'App Settings', subtitle: 'Version 1.1.0', action: () => {}, color: '#64748b' }
  ];

  const handleEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const { error } = await supabase
          .from('users')
          .update({ full_name: editName, email: editEmail, phone_number: editPhone })
          .eq('id', searchId);
        if (error) throw error;
      }
      setUser({ ...user, name: editName, email: editEmail, phone: editPhone });
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to save profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!editAvatar) return;
    setIsLoading(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const { error } = await supabase.from('users').update({ avatar_url: editAvatar }).eq('id', searchId);
        if (error) throw error;
      }
      const bustedUrl = `${editAvatar}${editAvatar.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
      setUser(prev => ({ ...prev, avatar: bustedUrl }));
      await refreshUser();
      setShowAvatarModal(false);
      Alert.alert("Success", "Profile picture updated");
    } catch (e) {
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 100
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchUserData} colors={['#10b981']} />}
      >
        <View style={styles.profileHero}>
           <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={styles.avatarWrapper}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={styles.avatarBadge}><RemixIcon name="ri-camera-fill" size={12} color="#fff" /></View>
           </TouchableOpacity>
           <Text style={styles.nameText}>{user.name}</Text>
           <Text style={styles.emailText}>{user.email}</Text>
           
           <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{user.totalOrders}</Text><Text style={styles.statLabel}>Completed</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={styles.statValue}>Eco</Text><Text style={styles.statLabel}>Partner</Text></View>
           </View>
        </View>

        <View style={styles.sectionContainer}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account Overview</Text>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editLink}><Text style={styles.editLinkText}>Edit Profile</Text></TouchableOpacity>
           </View>

           <View style={styles.menuList}>
              {menuItems.map((item, idx) => (
                 <TouchableOpacity key={idx} onPress={item.action} style={styles.menuItem}>
                    <View style={[styles.menuIconBox, { backgroundColor: item.color + '15' }]}><RemixIcon name={item.icon} size={20} color={item.color} /></View>
                    <View style={styles.menuText}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuSubtitle}>{item.subtitle}</Text></View>
                    <RemixIcon name="ri-arrow-right-s-line" size={20} color="#94a3b8" />
                 </TouchableOpacity>
              ))}
           </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
           <RemixIcon name="ri-logout-box-r-line" size={20} color="#ef4444" /><Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Borla Wura v1.1.0 • Made with ❤️</Text>
      </ScrollView>


      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.closeButton}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput style={styles.formInput} value={editName} onChangeText={setEditName} placeholder="Full Name" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput style={styles.formInput} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" placeholder="Email Address" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput style={styles.formInput} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" placeholder="Phone Number" />
              </View>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Avatar Privacy Modal */}
      <Modal visible={showAvatarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Update your profile picture to help riders identify you</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons name="images" size={24} color="#10b981" />
                <Text style={styles.imagePickerText}>Library</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleUpdateAvatar} disabled={isLoading || editAvatar === user.avatar}>
               {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Update Avatar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAvatarModal(false)}><Text style={styles.modalCancelButtonText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { },
  profileHero: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#f8fafc', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  avatar: { width: 100, height: 100, borderRadius: 34, backgroundColor: '#ffffff', borderWidth: 4, borderColor: '#ffffff' },
  avatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#f8fafc' },
  nameText: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a' },
  emailText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontFamily: typography.bold, color: '#1e293b' },
  statLabel: { fontSize: 11, fontFamily: typography.semiBold, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#f1f5f9' },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a' },
  editLink: { padding: 4 },
  editLinkText: { fontSize: 14, fontFamily: typography.semiBold, color: '#10b981' },
  menuList: { gap: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 15, fontFamily: typography.bold, color: '#1e293b' },
  menuSubtitle: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, paddingVertical: 16, borderRadius: 20, backgroundColor: '#fef2f2', gap: 8 },
  logoutBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#ef4444' },
  versionText: { textAlign: 'center', fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', marginTop: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalBottomContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: typography.bold, color: '#1f2937' },
  closeButton: { width: 32, height: 32, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  formContainer: { gap: 16, marginBottom: 24 },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontFamily: typography.medium, color: '#374151' },
  formInput: { padding: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, fontSize: 14, fontFamily: typography.regular, color: '#1f2937' },
  saveButton: { width: '100%', backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 14, fontFamily: typography.medium, color: '#ffffff' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, width: '90%', maxWidth: 400, alignSelf: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, marginBottom: 16, textAlign: 'center' },
  imagePickerBtn: { backgroundColor: '#ecfdf5', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, borderWidth: 1, borderColor: '#a7f3d0' },
  imagePickerText: { color: '#10b981', fontFamily: typography.semiBold, fontSize: 14 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelButton: { width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', marginTop: 12 },
  modalCancelButtonText: { fontSize: 14, fontFamily: typography.medium, color: '#4b5563' },
  modalOverlayCen: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  avatarPreviewContainer: { alignItems: 'center', marginVertical: 20 },
  avatarPreview: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f1f5f9' },
});

export default ProfilePage;
