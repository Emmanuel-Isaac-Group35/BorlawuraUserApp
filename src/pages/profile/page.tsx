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
    const fetchAddressCount = async () => {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const { count } = await supabase
          .from('user_addresses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', searchId);
        setAddresses(new Array(count || 0).fill({}));
      }
    };
    fetchAddressCount();
  }, [authUser]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setEditAvatar(result.assets[0].uri);
  };

  const handleEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditAvatar(user.avatar);
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Full Name is required.");
      return;
    }
    setIsLoading(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const updates: any = { 
          full_name: editName, 
          email: editEmail, 
          phone_number: editPhone 
        };
        
        // If avatar changed, update it too
        if (editAvatar !== user.avatar) {
          updates.avatar_url = editAvatar;
        }

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', searchId);
        
        if (error) throw error;
      }
      
      const bustedUrl = `${editAvatar}${editAvatar.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
      setUser({ 
        ...user, 
        name: editName, 
        email: editEmail, 
        phone: editPhone,
        avatar: bustedUrl
      });
      
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully");
      await refreshUser();
    } catch (e) {
      Alert.alert("Error", "Failed to save profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { icon: 'ri-map-pin-2-fill', title: 'Saved Addresses', subtitle: `${addresses.length} locations`, action: () => navigateTo('/saved-addresses'), color: '#10b981' },
    { icon: 'ri-history-fill', title: 'Pickup History', subtitle: 'View past orders', action: () => navigateTo('/orders'), color: '#8b5cf6' },
    { icon: 'ri-customer-service-2-fill', title: 'Help Center', subtitle: 'FAQs & Support', action: () => navigateTo('/support'), color: '#f59e0b' },
    { icon: 'ri-settings-4-fill', title: 'App Settings', subtitle: 'Version 1.1.0', action: () => {}, color: '#64748b' }
  ];

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
            <View style={styles.avatarWrapper}>
               <Image source={{ uri: user.avatar }} style={styles.avatar} />
            </View>
            
            <View style={styles.nameRow}>
               <Text style={styles.nameText}>{user.name}</Text>
            </View>
            <Text style={styles.emailText}>{user.email}</Text>

            <TouchableOpacity onPress={handleEditProfile} style={styles.unifiedEditBtn} activeOpacity={0.8}>
               <RemixIcon name="ri-edit-2-fill" size={14} color="#fff" />
               <Text style={styles.unifiedEditBtnText}>Edit Profile</Text>
            </TouchableOpacity>
           
           <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{user.totalOrders}</Text><Text style={styles.statLabel}>Completed</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={styles.statValue}>Eco</Text><Text style={styles.statLabel}>Partner</Text></View>
           </View>
        </View>

        <View style={styles.sectionContainer}>
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


      {/* Unified Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.closeButton}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View style={styles.editAvatarSection}>
                  <TouchableOpacity onPress={pickImage} style={styles.editAvatarWrapper}>
                     <Image source={{ uri: editAvatar || user.avatar }} style={styles.editAvatar} />
                     <View style={styles.editAvatarBadge}>
                        <RemixIcon name="ri-camera-fill" size={16} color="#fff" />
                     </View>
                  </TouchableOpacity>
                  <Text style={styles.editAvatarLabel}>Change Profile Photo</Text>
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
                  {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save All Changes</Text>}
               </TouchableOpacity>
               <View style={{ height: 40 }} />
            </ScrollView>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nameText: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a' },
  miniEditBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d1fae5' },
  unifiedEditBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#10b981', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12, 
    marginTop: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  unifiedEditBtnText: { fontSize: 13, fontFamily: typography.bold, color: '#fff' },
  emailText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 18, fontFamily: typography.bold, color: '#1e293b' },
  statLabel: { fontSize: 11, fontFamily: typography.semiBold, color: '#94a3b8', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#f1f5f9' },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 32, marginTop: -12 },
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
  editAvatarSection: { alignItems: 'center', marginBottom: 24 },
  editAvatarWrapper: { position: 'relative' },
  editAvatar: { width: 100, height: 100, borderRadius: 34, backgroundColor: '#f3f4f6' },
  editAvatarBadge: { position: 'absolute', bottom: -4, right: -4, width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  editAvatarLabel: { fontSize: 14, fontFamily: typography.bold, color: '#10b981', marginTop: 12 },
  formContainer: { gap: 16, marginBottom: 24 },
  formGroup: { gap: 8 },
  formLabel: { fontSize: 14, fontFamily: typography.medium, color: '#374151' },
  formInput: { padding: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, fontSize: 14, fontFamily: typography.medium, color: '#1f2937' },
  saveButton: { width: '100%', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
});

export default ProfilePage;
